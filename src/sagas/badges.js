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
  // Get the lastest status change for every badge.
  let statusBlockNumber = tcrBlockNumber
  const latestStatusChanges = {}
  const statusChanges = yield call(
    fetchEvents,
    'AddressStatusChange',
    arbitrableAddressListView,
    0,
    web3
  )

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

  // Mark items in appeal period.
  // Fetch badge disputes in appeal period.
  const addressesInAppealPeriod = yield call(
    fetchAppealableAddresses,
    arbitrableAddressListView,
    arbitrableTCRView
  )

  // Update appealPeriod state of each item.
  for (const address of Object.keys(cachedBadges.items))
    cachedBadges.items[address].inAppealPeriod = !!addressesInAppealPeriod[
      address
    ]

  return cachedBadges
}

/**
 * Fetches the block number of a deployed TCR contract.
 * @param {object} tcr - The TCR object.
 * @param {object} web3 - A web3 object to fetch events.
 * @returns {object} - An object with the TCR address and its deployment block number.
 */
function* fetchBlockNumber(tcr, web3) {
  // Fetch the contract deployment block number. We use the first meta evidence
  // events emitted when the constructor is run.
  const metaEvidenceEvents = (yield call(
    fetchEvents,
    'MetaEvidence',
    tcr,
    0,
    web3
  )).sort((a, b) => a.blockNumber - b.blockNumber)

  return {
    address: tcr.options.address,
    blockNumber: metaEvidenceEvents[0].blockNumber
  }
}

/**
 * Fetches all items from all badge TCRs.
 * @param {{ type: string, payload: ?object, meta: ?object }} action - The action object.
 */
function* fetchBadges() {
  const {
    badgeViewContracts,
    arbitratorView,
    ARBITRATOR_BLOCK,
    viewWeb3,
    arbitrableTCRView
  } = yield call(instantiateEnvObjects)

  const blockNumbers = (yield all(
    Object.keys(badgeViewContracts).map(address =>
      call(fetchBlockNumber, badgeViewContracts[address], viewWeb3)
    )
  )).reduce((acc, curr) => {
    acc[curr.address] = curr.blockNumber
    return acc
  }, {})

  try {
    const badges = (yield all(
      Object.keys(badgeViewContracts).map(address =>
        call(fetchItems, {
          arbitrableAddressListView: badgeViewContracts[address],
          blockNumber: blockNumbers[address],
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
