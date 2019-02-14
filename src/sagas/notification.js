import { eventChannel } from 'redux-saga'
import memoizeOne from 'memoize-one'

import {
  call,
  fork,
  put,
  race,
  select,
  take,
  takeLatest
} from 'redux-saga/effects'

import * as notificationActions from '../actions/notification'
import * as walletSelectors from '../reducers/wallet'
import * as walletActions from '../actions/wallet'
import * as arbitrableTokenListSelectors from '../reducers/arbitrable-token-list'
import * as arbitrableTokenListActions from '../actions/arbitrable-token-list'
import * as tokenActions from '../actions/token'
import { lessduxSaga } from '../utils/saga'
import { action } from '../utils/action'
import { arbitrableTokenList, web3 } from '../bootstrap/dapp-api'
import * as tcrConstants from '../constants/tcr'
import { contractStatusToClientStatus } from '../utils/tcr'

import { fetchToken } from './token'

// Helpers
const getBlockDate = memoizeOne(blockHash =>
  web3.eth.getBlock(blockHash).then(block => new Date(block.timestamp * 1000))
)

const emitNotifications = async (account, timeToChallenge, emitter, events) => {
  const notifiedIDs = {}
  let oldestNonDisputedSubmittedStatusEvent

  for (const event of events.reverse()) {
    const { returnValues } = event

    if (notifiedIDs[event.returnValues._tokenID]) continue
    const isRequester = account === event.returnValues._requester
    if (!isRequester && account !== event.returnValues._challenger) continue

    let message
    switch (Number(returnValues._status)) {
      case tcrConstants.IN_CONTRACT_STATUS_ENUM.RegistrationRequested:
      case tcrConstants.IN_CONTRACT_STATUS_ENUM.ClearingRequested: {
        if (
          returnValues._disputed === true &&
          returnValues._appealed === false &&
          isRequester
        )
          message = `${
            isRequester
              ? 'Your token request has challenged.'
              : 'You challenged a token request.'
          }`
        else if (
          returnValues._disputed === true &&
          returnValues._appealed === true &&
          isRequester
        )
          message = `${
            isRequester
              ? 'An appeal was raised on your token request.'
              : 'An appeal was raised on a request you challenged.'
          }`
        else if (returnValues._disputed === false)
          oldestNonDisputedSubmittedStatusEvent = event
        break
      }
      case tcrConstants.IN_CONTRACT_STATUS_ENUM.Registered: {
        if (returnValues._disputed === false)
          message = `${
            isRequester
              ? 'Your token registration request'
              : 'A token registration request you challenged'
          } has been executed.`
        else
          message = `${
            isRequester
              ? 'Your challenged token registration request'
              : 'A token registration request you challenged'
          } has been executed.`
        break
      }
      case tcrConstants.IN_CONTRACT_STATUS_ENUM.Absent: {
        if (returnValues._disputed === false)
          message = `${
            isRequester
              ? 'Your token clearing request'
              : 'A token clearing request you challenged'
          } has been executed.`
        else
          message = `${
            isRequester
              ? 'Your token clearing request'
              : 'A token clearing request you challenged'
          } has been refused.`
        break
      }
      default: {
        console.warn('Unhandled notification: ', returnValues)
        console.warn('isRequester', isRequester)
        console.warn('account', account)
        break
      }
    }

    const clientStatus = contractStatusToClientStatus(
      returnValues._status,
      returnValues._disputed
    )

    if (message) {
      notifiedIDs[returnValues._tokenID] =
        returnValues._disputed === true &&
        (returnValues._status ===
          tcrConstants.IN_CONTRACT_STATUS_ENUM.RegistrationRequested ||
          returnValues._status ===
            tcrConstants.IN_CONTRACT_STATUS_ENUM.ClearingRequested)
          ? 'disputed'
          : true

      emitter({
        ID: returnValues._tokenID,
        date: await getBlockDate(event.blockHash),
        message,
        clientStatus
      })
    }
  }

  if (
    oldestNonDisputedSubmittedStatusEvent &&
    notifiedIDs[oldestNonDisputedSubmittedStatusEvent.returnValues._tokenID] !==
      'disputed'
  ) {
    const date = await getBlockDate(
      oldestNonDisputedSubmittedStatusEvent.blockHash
    )
    if (timeToChallenge && Date.now() - date > timeToChallenge)
      emitter({
        ID: oldestNonDisputedSubmittedStatusEvent.returnValues._tokenID,
        date,
        message: 'Token request pending execution.',
        clientStatus: oldestNonDisputedSubmittedStatusEvent.returnValues._status
      })
  }

  if (events[0])
    localStorage.setItem(
      `${arbitrableTokenList.options.address}nextEventsBlockNumber`,
      events[0].blockNumber + 1
    )
}

/**
 * Notification listener.
 */
function* pushNotificationsListener() {
  // Start after receiving accounts and data
  yield put(action(arbitrableTokenListActions.arbitrableTokenListData.FETCH))
  yield take(walletActions.accounts.RECEIVE)
  yield take(arbitrableTokenListActions.arbitrableTokenListData.RECEIVE)
  while (true) {
    const account = yield select(walletSelectors.getAccount) // Cache current account
    const timeToChallenge = yield select(
      arbitrableTokenListSelectors.getTimeToChallenge
    ) // Cache current time to challenge

    // Set up event channel with subscriber
    const channel = eventChannel(emitter => {
      arbitrableTokenList
        .getPastEvents('TokenStatusChange', {
          fromBlock:
            localStorage.getItem(
              `${arbitrableTokenList.options.address}nextEventsBlockNumber`
            ) || 0
        })
        .then(events => {
          emitNotifications(account, timeToChallenge, emitter, events)
        })
      arbitrableTokenList.events.TokenStatusChange().on('data', event => {
        emitNotifications(account, timeToChallenge, emitter, [event])
        emitter(event.returnValues._tokenID)
      })
      return () => {} // Unsubscribe function
    })

    // Keep listening while on the same account
    while (
      account === (yield select(walletSelectors.getAccount)) &&
      timeToChallenge ===
        (yield select(arbitrableTokenListSelectors.getTimeToChallenge))
    ) {
      const [notification, accounts, arbitrableTokenListData] = yield race([
        take(channel), // New notification
        take(walletActions.accounts.RECEIVE), // Accounts refetch
        take(arbitrableTokenListActions.arbitrableTokenListData.RECEIVE) // Arbitrable token list data refetch
      ])
      if (accounts || arbitrableTokenListData) continue // Possible account or time to challenge change

      // Put new notification
      yield put(
        typeof notification === 'string'
          ? action(tokenActions.token.RECEIVE_UPDATED, {
              collectionMod: {
                collection: tokenActions.tokens.self,
                resource: yield call(fetchToken, {
                  payload: { ID: notification, withDisputeData: true }
                }),
                updating: notification,
                find: d => d.ID === notification
              }
            })
          : action(notificationActions.notification.RECEIVE, {
              collectionMod: {
                collection: notificationActions.notifications.self,
                resource: notification
              }
            })
      )
    }

    // We changed accounts, so close the channel. This calls unsubscribe under the hood which clears handlers for the old account
    channel.close()
  }
}

/**
 * The root of the notification saga.
 */
export default function* notificationSaga() {
  // Listeners
  yield fork(pushNotificationsListener)

  // Notification
  yield takeLatest(
    notificationActions.notification.DELETE,
    lessduxSaga,
    {
      flow: 'delete',
      collection: notificationActions.notifications.self,
      find: ({ payload: { ID } }) => n => n.ID === ID
    },
    notificationActions.notification,
    null
  )
}
