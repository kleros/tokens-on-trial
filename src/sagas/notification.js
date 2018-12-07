import { eventChannel } from 'redux-saga'
import memoizeOne from 'memoize-one'

import {
  fork,
  takeLatest,
  take,
  select,
  race,
  call,
  put
} from 'redux-saga/effects'

import * as notificationActions from '../actions/notification'
import * as walletSelectors from '../reducers/wallet'
import * as walletActions from '../actions/wallet'
import * as arbitrableTokenListSelectors from '../reducers/arbitrable-token-list'
import * as arbitrableTokenListActions from '../actions/arbitrable-token-list'
import * as tokenActions from '../actions/token'
import { lessduxSaga } from '../utils/saga'
import { action } from '../utils/action'
import { web3, arbitrableTokenList } from '../bootstrap/dapp-api'
import * as tokenConstants from '../constants/token'

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

    if (notifiedIDs[event.returnValues.tokenID]) continue
    const isRequester = account === event.returnValues.requester
    if (!isRequester && account !== event.returnValues.challenger) continue

    let message
    switch (Number(returnValues.status)) {
      case tokenConstants.IN_CONTRACT_STATUS_ENUM.RegistrationRequested:
      case tokenConstants.IN_CONTRACT_STATUS_ENUM.ClearingRequested:
        if (returnValues.disputed === true && isRequester)
          message = 'Your request has been challenged.'
        else if (returnValues.disputed === false)
          oldestNonDisputedSubmittedStatusEvent = event
        break
      case tokenConstants.IN_CONTRACT_STATUS_ENUM.Registered:
        if (returnValues.disputed === false)
          message = `${
            isRequester ? 'Your request' : 'A request you challenged'
          } has been executed.`
        break
      case tokenConstants.IN_CONTRACT_STATUS_ENUM.Cleared:
        if (returnValues.disputed === false)
          message = `${
            isRequester ? 'Your request' : 'A request you challenged'
          } has been rejected.`
        break
      default:
        break
    }

    if (message) {
      notifiedIDs[event.returnValues.tokenID] =
        event.returnValues.disputed === true ? 'disputed' : true
      emitter({
        ID: event.returnValues.tokenID,
        date: await getBlockDate(event.blockHash),
        message
      })
    }
  }

  if (
    oldestNonDisputedSubmittedStatusEvent &&
    notifiedIDs[oldestNonDisputedSubmittedStatusEvent.returnValues.tokenID] !==
      'disputed'
  ) {
    const date = await getBlockDate(
      oldestNonDisputedSubmittedStatusEvent.blockHash
    )
    if (Date.now() - date > timeToChallenge)
      emitter({
        ID: oldestNonDisputedSubmittedStatusEvent.returnValues.tokenID,
        date,
        message: 'Token pending execution.'
      })
  }

  if (events[0])
    localStorage.setItem(
      arbitrableTokenList.options.address + 'nextEventsBlockNumber',
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
              arbitrableTokenList.options.address + 'nextEventsBlockNumber'
            ) || 0
        })
        .then(events => {
          emitNotifications(account, timeToChallenge, emitter, events)
        })
      arbitrableTokenList.events.TokenStatusChange().on('data', event => {
        emitNotifications(account, timeToChallenge, emitter, [event])
        emitter(event.returnValues.tokenID)
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
                  payload: { ID: notification }
                })
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