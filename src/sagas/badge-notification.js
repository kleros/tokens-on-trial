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
import * as arbitrableAddressListSelectors from '../reducers/arbitrable-address-list'
import * as arbitrableTokenListActions from '../actions/arbitrable-token-list'
import * as tokenActions from '../actions/token'
import { lessduxSaga } from '../utils/saga'
import { action } from '../utils/action'
import {
  arbitrableAddressList,
  arbitrableTokenList,
  web3
} from '../bootstrap/dapp-api'
import * as tcrConstants from '../constants/tcr'
import { contractStatusToClientStatus } from '../utils/tcr'

import { fetchToken } from './token'

// Helpers
const getBlockDate = memoizeOne(blockHash =>
  web3.eth.getBlock(blockHash).then(block => new Date(block.timestamp * 1000))
)

const zeroSubmissionID =
  '0x0000000000000000000000000000000000000000000000000000000000000000'
const filter = [
  false, // Do not include tokens which are not on the TCR.
  true, // Include registered tokens.
  false, // Do not include tokens with pending registration requests.
  true, // Include tokens with pending clearing requests.
  false, // Do not include tokens with challenged registration requests.
  true, // Include tokens with challenged clearing requests.
  false, // Include token if caller is the author of a pending request.
  false // Include token if caller is the challenger of a pending request.
]

const emitNotifications = async (account, timeToChallenge, emitter, events) => {
  const notifiedIDs = {}
  let oldestNonDisputedSubmittedStatusEvent

  for (const event of events.reverse()) {
    const { returnValues } = event

    const tokenID = (await arbitrableTokenList.methods
      .queryTokens(
        zeroSubmissionID, // A token ID from which to start/end the query from. Set to zero means unused.
        100, // Number of items to return at once.
        filter,
        true, // Return oldest first.
        event.returnValues._address // The token address for which to return the submissions.
      )
      .call({ from: account })).values.filter(ID => ID !== zeroSubmissionID)[0]

    if (notifiedIDs[tokenID]) continue
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
              ? 'Your badge request has challenged.'
              : 'You challenged a badge request.'
          }`
        else if (
          returnValues._disputed === true &&
          returnValues._appealed === true &&
          isRequester
        )
          message = `${
            isRequester
              ? 'An appeal was raised on your badge request.'
              : 'An appeal was raised on a request you challenged.'
          }`
        else if (returnValues._disputed === false) {
          oldestNonDisputedSubmittedStatusEvent = event
          oldestNonDisputedSubmittedStatusEvent['tokenID'] = tokenID
        }
        break
      }
      case tcrConstants.IN_CONTRACT_STATUS_ENUM.Registered: {
        if (returnValues._disputed === false)
          message = `${
            isRequester
              ? 'Your badge registration request'
              : 'A badge registration request you challenged'
          } has been executed.`
        else
          message = `${
            isRequester
              ? 'Your challenged badge registration request'
              : 'A badge registration request you challenged'
          } has been executed.`
        break
      }
      case tcrConstants.IN_CONTRACT_STATUS_ENUM.Absent: {
        if (returnValues._disputed === false)
          message = `${
            isRequester
              ? 'Your badge clearing request'
              : 'A badge clearing request you challenged'
          } has been executed.`
        else
          message = `${
            isRequester
              ? 'Your badge clearing request'
              : 'A badge clearing request you challenged'
          } has been refused.`
        break
      }
      default: {
        console.info('Unhandled notification: ', returnValues)
        console.info('isRequester', isRequester)
        console.info('account', account)
        break
      }
    }

    const clientStatus = contractStatusToClientStatus(
      returnValues._status,
      returnValues._disputed
    )

    if (message) {
      notifiedIDs[tokenID] =
        returnValues._disputed === true &&
        (returnValues._status ===
          tcrConstants.IN_CONTRACT_STATUS_ENUM.RegistrationRequested ||
          returnValues._status ===
            tcrConstants.IN_CONTRACT_STATUS_ENUM.ClearingRequested)
          ? 'disputed'
          : true

      emitter({
        ID: tokenID,
        date: await getBlockDate(event.blockHash),
        message,
        clientStatus
      })
    }
  }

  if (
    oldestNonDisputedSubmittedStatusEvent &&
    notifiedIDs[oldestNonDisputedSubmittedStatusEvent.tokenID] !== 'disputed'
  ) {
    const date = await getBlockDate(
      oldestNonDisputedSubmittedStatusEvent.blockHash
    )
    console.info(
      'date ',
      date,
      ' timeToChallenge ',
      timeToChallenge,
      ' Date.now() ',
      Date.now()
    )
    if (Date.now() - date > timeToChallenge)
      emitter({
        ID: oldestNonDisputedSubmittedStatusEvent.tokenID,
        date,
        message: 'Badge request pending execution.',
        clientStatus: oldestNonDisputedSubmittedStatusEvent.returnValues._status
      })
  }

  if (events[0])
    localStorage.setItem(
      `${arbitrableAddressList.options.address}nextEventsBlockNumber`,
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
      arbitrableAddressListSelectors.getTimeToChallenge
    ) // Cache current time to challenge
    console.info('timeToChallenge', timeToChallenge)

    // Set up event channel with subscriber
    const channel = eventChannel(emitter => {
      arbitrableAddressList
        .getPastEvents('AddressStatusChange', {
          fromBlock:
            localStorage.getItem(
              `${arbitrableAddressList.options.address}nextEventsBlockNumber`
            ) || 0
        })
        .then(events => {
          emitNotifications(account, timeToChallenge, emitter, events)
        })
      arbitrableAddressList.events.AddressStatusChange().on('data', event => {
        emitNotifications(account, timeToChallenge, emitter, [event])
        emitter(event.returnValues._address)
      })
      return () => {} // Unsubscribe function
    })

    // Keep listening while on the same account
    while (
      account === (yield select(walletSelectors.getAccount)) &&
      timeToChallenge ===
        (yield select(arbitrableAddressListSelectors.getTimeToChallenge))
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
