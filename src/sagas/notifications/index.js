import { eventChannel } from 'redux-saga'

import { fork, put, race, select, take, takeLatest } from 'redux-saga/effects'

import * as notificationActions from '../../actions/notification'
import * as walletSelectors from '../../reducers/wallet'
import * as walletActions from '../../actions/wallet'
import * as arbitrableTokenListSelectors from '../../reducers/arbitrable-token-list'
import * as arbitrableTokenListActions from '../../actions/arbitrable-token-list'
import * as arbitrableAddressListSelectors from '../../reducers/arbitrable-address-list'
import * as arbitrableAddressListActions from '../../actions/arbitrable-address-list'
import { lessduxSaga } from '../../utils/saga'
import { action } from '../../utils/action'
import {
  arbitrableTokenList,
  arbitrableAddressList,
  arbitrator
} from '../../bootstrap/dapp-api'

import emitTokenNotifications from './token-events'
import emitBadgeNotifications from './badge-events'
import emitArbitratorNotifications from './arbitrator-events'

/**
 * Notification listener.
 */
function* pushNotificationsListener() {
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

      // T2CR events
      arbitrableTokenList
        .getPastEvents('TokenStatusChange', {
          fromBlock:
            localStorage.getItem(
              `${arbitrableTokenList.options.address}nextEventsBlockNumber`
            ) || 0
        })
        .then(events => {
          emitTokenNotifications(account, t2crTimeToChallenge, emit, events)
        })
      arbitrableTokenList.events.TokenStatusChange().on('data', event => {
        if (!txHashes[event.transactionHash]) {
          txHashes[event.transactionHash] = true
          emitTokenNotifications(account, t2crTimeToChallenge, emit, [event])
        }
      })

      // Badge events
      arbitrableAddressList
        .getPastEvents('AddressStatusChange', {
          fromBlock:
            localStorage.getItem(
              `${arbitrableAddressList.options.address}nextEventsBlockNumber`
            ) || 0
        })
        .then(events => {
          emitBadgeNotifications(account, badgeTimeToChallenge, emit, events)
        })
      arbitrableAddressList.events.AddressStatusChange().on('data', event => {
        if (!txHashes[event.transactionHash]) {
          txHashes[event.transactionHash] = true
          emitBadgeNotifications(account, badgeTimeToChallenge, emit, [event])
        }
      })

      // Arbitator events
      arbitrator
        .getPastEvents('AppealPossible', {
          fromBlock:
            localStorage.getItem(
              `${arbitrator.options.address}nextEventsBlockNumber`
            ) || 0
        })
        .then(events => {
          emitArbitratorNotifications(account, emit, events)
        })
      arbitrator.events.AppealPossible().on('data', event => {
        if (!txHashes[event.transactionHash]) {
          txHashes[event.transactionHash] = true
          emitArbitratorNotifications(account, emit, [event])
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
