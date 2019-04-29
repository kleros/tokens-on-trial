import { eventChannel } from 'redux-saga'

import {
  fork,
  put,
  call,
  race,
  select,
  take,
  takeLatest
} from 'redux-saga/effects'

import * as notificationActions from '../../actions/notification'
import * as walletSelectors from '../../reducers/wallet'
import * as walletActions from '../../actions/wallet'
import * as arbitrableTokenListSelectors from '../../reducers/arbitrable-token-list'
import * as arbitrableTokenListActions from '../../actions/arbitrable-token-list'
import * as arbitrableAddressListSelectors from '../../reducers/arbitrable-address-list'
import * as arbitrableAddressListActions from '../../actions/arbitrable-address-list'
import { lessduxSaga } from '../../utils/saga'
import { action } from '../../utils/action'
import { instantiateEnvObjects } from '../../utils/tcr'
import { APP_VERSION } from '../../bootstrap/dapp-api'

import emitTokenNotifications from './token-events'
import emitBadgeNotifications from './badge-events'
import emitArbitratorNotifications from './arbitrator-events'

/**
 * Notification listener.
 */
function* pushNotificationsListener() {
  const {
    arbitrableTokenListView,
    arbitrableAddressListView,
    arbitratorView,
    viewWeb3,
    arbitratorEvents,
    arbitrableAddressListEvents,
    arbitrableTokenListEvents,
    latestBlock
  } = yield call(instantiateEnvObjects)

  // Get cached notifications
  const cachedNotifications = localStorage.getItem(
    `${arbitrableTokenListView.options.address}.notifications@${APP_VERSION}`
  )
  if (cachedNotifications)
    yield put(notificationActions.loadState(JSON.parse(cachedNotifications)))

  // Start after receiving accounts and data
  yield put(action(arbitrableTokenListActions.arbitrableTokenListData.FETCH))
  yield put(
    action(arbitrableAddressListActions.arbitrableAddressListData.FETCH)
  )
  yield take(walletActions.accounts.RECEIVE)
  yield take(arbitrableTokenListActions.arbitrableTokenListData.RECEIVE)
  yield take(arbitrableAddressListActions.arbitrableAddressListData.RECEIVE)
  while (true) {
    const account = yield select(walletSelectors.getAccount) // Cache current account
    const t2crTimeToChallenge = yield select(
      arbitrableTokenListSelectors.getTimeToChallenge
    )
    const badgeTimeToChallenge = yield select(
      arbitrableAddressListSelectors.getTimeToChallenge
    )

    // Set up event channel with subscriber
    const channel = eventChannel(emit => {
      // Due to an issue with web3js, events get emitted as many times as
      // there are subscribers listening to them. To get around this, keep
      // a dictionary of txHashes and only emit notifications if the event is unique.
      // https://ethereum.stackexchange.com/questions/62799/problem-with-multiple-event-listeners-duplicated-event-triggers#
      const txHashes = {}
      const fromBlock =
        localStorage.getItem(
          `${arbitrableTokenListView.options.address}nextEventsBlockNumber`
        ) || latestBlock

      // T2CR events
      arbitrableTokenListView
        .getPastEvents('TokenStatusChange', {
          fromBlock
        })
        .then(events => {
          emitTokenNotifications(account, t2crTimeToChallenge, emit, events, {
            arbitrableTokenListView,
            fromBlock,
            viewWeb3
          })
        })
      arbitrableTokenListEvents.events.TokenStatusChange((err, event) => {
        if (err) {
          console.error(err)
          return
        }
        if (!txHashes[event.transactionHash]) {
          txHashes[event.transactionHash] = true
          emitTokenNotifications(account, t2crTimeToChallenge, emit, [event], {
            arbitrableTokenListView,
            fromBlock,
            viewWeb3
          })
        }
      })

      // Badge events
      arbitrableAddressListView
        .getPastEvents('AddressStatusChange', {
          fromBlock
        })
        .then(events => {
          emitBadgeNotifications(account, badgeTimeToChallenge, emit, events, {
            arbitrableAddressListView,
            arbitrableTokenListView,
            viewWeb3,
            fromBlock
          })
        })
      arbitrableAddressListEvents.events.AddressStatusChange((err, event) => {
        if (err) {
          console.error(err)
          return
        }
        if (!txHashes[event.transactionHash]) {
          txHashes[event.transactionHash] = true
          emitBadgeNotifications(account, badgeTimeToChallenge, emit, [event], {
            arbitrableAddressListView,
            arbitrableTokenListView,
            viewWeb3,
            fromBlock
          })
        }
      })

      // Arbitator events
      arbitratorView
        .getPastEvents('AppealPossible', {
          fromBlock
        })
        .then(events => {
          emitArbitratorNotifications(account, emit, events, {
            arbitrableAddressListView,
            arbitratorView,
            arbitrableTokenListView,
            viewWeb3
          })
        })
      arbitratorEvents.events.AppealPossible((err, event) => {
        if (err) {
          console.error(err)
          return
        }
        if (!txHashes[event.transactionHash]) {
          txHashes[event.transactionHash] = true
          emitArbitratorNotifications(account, emit, [event], {
            arbitrableAddressListView,
            arbitratorView,
            arbitrableTokenListView,
            viewWeb3
          })
        }
      })
      return () => {} // Unsubscribe function
    })

    // Keep listening while on the same account
    while (
      account === (yield select(walletSelectors.getAccount)) &&
      t2crTimeToChallenge ===
        (yield select(arbitrableTokenListSelectors.getTimeToChallenge)) &&
      badgeTimeToChallenge ===
        (yield select(arbitrableAddressListSelectors.getTimeToChallenge))
    ) {
      const [
        notification,
        accounts,
        arbitrableTokenListData,
        arbitrableAddressListData
      ] = yield race([
        take(channel), // New notification
        take(walletActions.accounts.RECEIVE), // Accounts refetch
        take(arbitrableTokenListActions.arbitrableTokenListData.RECEIVE), // T2CR data refetch
        take(arbitrableAddressListActions.arbitrableAddressListData.RECEIVE) // Badge TCR data refetch
      ])

      if (accounts || arbitrableTokenListData || arbitrableAddressListData)
        continue

      // Put new notification
      yield put(
        action(notificationActions.notification.RECEIVE, {
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
      find: ({ payload: { ID } }) => n => ID === n.ID
    },
    notificationActions.notification,
    null
  )
}
