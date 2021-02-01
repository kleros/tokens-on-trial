import { call, takeLatest } from 'redux-saga/effects'
import * as arbitratorActions from '../actions/arbitrator'
import { lessduxSaga } from '../utils/saga'
import { instantiateEnvObjects } from '../utils/tcr'
import { fetchEvents } from './utils'

/**
 * Fetches the arbitrators's data.
 * @param {{ type: string, payload: ?object, meta: ?object }} action - The action object.
 * @returns {object} - The fetched data.
 */
export function* fetchArbitratorData() {
  const { arbitratorView, ARBITRATOR_BLOCK, viewWeb3 } = yield call(
    instantiateEnvObjects
  )

  const eventsData = {
    appealDecisionEvents: {
      blockNumber: Number(ARBITRATOR_BLOCK),
      events: {},
    },
  }

  eventsData.appealDecisionEvents.events = (yield call(
    fetchEvents,
    'AppealDecision',
    arbitratorView,
    ARBITRATOR_BLOCK,
    viewWeb3
  )).reduce((acc, curr) => {
    const {
      returnValues: { _disputeID },
      blockNumber,
    } = curr

    if (blockNumber > eventsData.appealDecisionEvents.blockNumber)
      eventsData.appealDecisionEvents.blockNumber = blockNumber

    if (!acc[_disputeID]) acc[_disputeID] = {}

    acc[_disputeID][curr.transactionHash] = {
      returnValues: curr.returnValues,
      transactionHash: curr.transactionHash,
      blockNumber: curr.blockNumber,
    }
    return acc
  }, eventsData.appealDecisionEvents.events)

  return {
    appealDecisionEvents: eventsData.appealDecisionEvents,
  }
}

/**
 * The root of the arbitrable token list saga.
 */
export default function* arbitratorSaga() {
  // Arbitrable Token List Data
  yield takeLatest(
    arbitratorActions.arbitratorData.FETCH,
    lessduxSaga,
    'fetch',
    arbitratorActions.arbitratorData,
    fetchArbitratorData
  )
}
