import localforage from 'localforage'

import { put, takeLatest, call, all } from 'redux-saga/effects'

import {
  FETCH_BADGES_CACHE,
  cacheBadges,
  fetchBadgesFailed
} from '../actions/badges'
import {
  contractStatusToClientStatus,
  instantiateEnvObjects
} from '../utils/tcr'
import { APP_VERSION } from '../bootstrap/dapp-api'

import { fetchEvents, fetchAppealableAddresses } from './utils'

/**
 * Fetches the all items in a TCR.
 * @param {object} tcr - The TCR object.
 * @returns {object} - The items on the tcr.
 */
function* fetchItems({
  arbitrableAddressListView,
  blockNumber: tcrBlockNumber,
  badges,
  web3,
  arbitrableTCRView
}) {
  // Get the lastest status change for every badge
  // and all appealable addresses.
  let statusBlockNumber = tcrBlockNumber
  const latestStatusChanges = {}
  const [statusChanges, addressesInAppealPeriod] = yield all([
    call(
      fetchEvents,
      'AddressStatusChange',
      arbitrableAddressListView,
      0,
      web3
    ),
    call(fetchAppealableAddresses, arbitrableAddressListView, arbitrableTCRView)
  ])

  statusChanges.forEach(event => {
    const { returnValues } = event
    const { _address } = returnValues
    if (event.blockNumber > statusBlockNumber)
      statusBlockNumber = event.blockNumber

    if (!latestStatusChanges[_address]) {
      latestStatusChanges[_address] = event
      return
    }
    if (event.blockNumber > latestStatusChanges[_address].blockNumber)
      latestStatusChanges[_address] = event
  })

  const statusEvents = Object.keys(latestStatusChanges).map(
    address => latestStatusChanges[address]
  )

  const cachedBadges = {
    ...badges,
    statusBlockNumber
  }

  statusEvents.forEach(event => {
    const { returnValues, blockNumber } = event
    const {
      _address,
      _status,
      _disputed,
      _requester,
      _challenger
    } = returnValues
    cachedBadges.items[_address] = {
      address: _address,
      badgeContractAddr: arbitrableAddressListView.options.address,
      blockNumber,
      status: {
        status: Number(_status),
        disputed: _disputed,
        requester: _requester,
        challenger: _challenger
      }
    }
  })

  Object.keys(cachedBadges.items).forEach(address => {
    cachedBadges.items[address].clientStatus = contractStatusToClientStatus(
      cachedBadges.items[address].status.status,
      cachedBadges.items[address].status.disputed
    )
  })

  // Update appealPeriod state of each item.
  for (const address of Object.keys(cachedBadges.items))
    cachedBadges.items[address].inAppealPeriod = !!addressesInAppealPeriod[
      address
    ]

  return cachedBadges
}

/**
 * Fetches all items from all badge TCRs.
 * @param {{ type: string, payload: ?object, meta: ?object }} action - The action object.
 */
function* fetchBadges() {
  const {
    badgeViewContracts,
    arbitrableTokenListView: {
      options: { address: t2crAddr }
    },
    arbitrableTCRView,
    arbitratorView,
    ARBITRATOR_BLOCK,
    viewWeb3
  } = yield call(instantiateEnvObjects)

  try {
    const cachedBadges = yield localforage.getItem(
      `${t2crAddr}badges@${APP_VERSION}`
    )
    if (cachedBadges)
      // Display current cache while loading newer data.
      yield put(cacheBadges(cachedBadges))

    const badges = (yield all(
      Object.keys(badgeViewContracts).map(address =>
        call(fetchItems, {
          arbitrableAddressListView: badgeViewContracts[address],
          blockNumber: 0,
          badges: {
            badgeContractAddr: address,
            statusBlockNumber: 0, // Use contract block number by default
            items: {}
          },
          arbitratorView,
          ARBITRATOR_BLOCK,
          web3: viewWeb3,
          arbitrableTCRView
        })
      )
    )).reduce((acc, curr) => {
      acc[curr.badgeContractAddr] = curr
      return acc
    }, {})

    yield put(cacheBadges(badges))
    localforage.setItem(`${t2crAddr}badges@${APP_VERSION}`, badges)
  } catch (err) {
    console.error('Error fetching badges ', err)
    yield put(fetchBadgesFailed())
  }
}

/**
 * The root of the badges saga.
 */
export default function* actionWatcher() {
  yield takeLatest(FETCH_BADGES_CACHE, fetchBadges)
}
