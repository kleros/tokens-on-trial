import { put, takeLatest, select, call } from 'redux-saga/effects'

import { FETCH_BADGES_CACHE, CACHE_BADGES } from '../actions/badges'
import * as badgesSelectors from '../reducers/badges'
import { arbitrableAddressList } from '../bootstrap/dapp-api'
import { contractStatusToClientStatus } from '../utils/tcr'

const fetchEvents = async (eventName, fromBlock) =>
  arbitrableAddressList.getPastEvents(eventName, { fromBlock })

/**
 * Fetches a paginatable list of badges.
 * @param {{ type: string, payload: ?object, meta: ?object }} action - The action object.
 */
function* fetchBadges() {
  // Get the lastest status change for every token.
  let statusBlockNumber = 0
  const latestStatusChanges = {}
  const badges = (yield select(badgesSelectors.getBadges)).data
  const statusChanges = yield call(
    fetchEvents,
    'AddressStatusChange',
    badges.statusBlockNumber
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
    items: {
      ...badges.items
    },
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

  yield put({ type: CACHE_BADGES, payload: { badges: cachedBadges } })
}

/**
 * The root of the badges saga.
 */
export default function* actionWatcher() {
  yield takeLatest(FETCH_BADGES_CACHE, fetchBadges)
}
