import { put, takeLatest, select, call } from 'redux-saga/effects'

import {
  FETCH_BADGES_CACHE,
  cacheBadges,
  fetchBadgesFailed
} from '../actions/badges'
import * as badgesSelectors from '../reducers/badges'
import { arbitrableAddressListView } from '../bootstrap/dapp-api'
import { contractStatusToClientStatus } from '../utils/tcr'

const fetchEvents = async (eventName, fromBlock) =>
  arbitrableAddressListView.getPastEvents(eventName, { fromBlock })

/**
 * Fetches a paginatable list of badges.
 * @param {{ type: string, payload: ?object, meta: ?object }} action - The action object.
 */
function* fetchBadges() {
  try {
    // Get the lastest status change for every token.
    let statusBlockNumber = 0
    const latestStatusChanges = {}
    const badges = JSON.parse(
      JSON.stringify((yield select(badgesSelectors.getBadges)).data)
    ) // Deep copy.
    const statusChanges = yield call(
      fetchEvents,
      'AddressStatusChange',
      badges.statusBlockNumber + 1
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

    yield put(cacheBadges(cachedBadges))
  } catch (err) {
    console.error('Error fetching badges: ', err)
    yield put(fetchBadgesFailed())
  }
}

/**
 * The root of the badges saga.
 */
export default function* actionWatcher() {
  yield takeLatest(FETCH_BADGES_CACHE, fetchBadges)
}
