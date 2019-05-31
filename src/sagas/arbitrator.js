import { call, takeLatest } from 'redux-saga/effects'

import * as arbitratorActions from '../actions/arbitrator'
import { lessduxSaga } from '../utils/saga'
import { instantiateEnvObjects } from '../utils/tcr'
import { APP_VERSION } from '../bootstrap/dapp-api'
import { fetchEvents } from '../sagas/utils'

/**
 * Fetches the arbitrators's data.
 * @param {{ type: string, payload: ?object, meta: ?object }} action - The action object.
 * @returns {object} - The fetched data.
 */
export function* fetchArbitratorData() {
  const { arbitratorView, ARBITRATOR_BLOCK, viewWeb3 } = yield call(
    instantiateEnvObjects
  )

  let eventsData = {
    appealDecisionEvents: {
      blockNumber: Number(ARBITRATOR_BLOCK),
      events: {}
    }
  }

  // Load from cache, if available.
  if (
    localStorage.getItem(
      `${arbitratorView.options.address}arbitratorData@${APP_VERSION}`
    )
  )
    eventsData = JSON.parse(
      localStorage.getItem(
        `${arbitratorView.options.address}arbitratorData@${APP_VERSION}`
      )
    )

  eventsData.appealDecisionEvents.events = (yield call(
    fetchEvents,
    'AppealDecision',
    arbitratorView,
    eventsData.appealDecisionEvents.blockNumber,
    viewWeb3
  )).reduce((acc, curr) => {
    const {
      returnValues: { _disputeID },
      blockNumber
    } = curr

    if (blockNumber > eventsData.appealDecisionEvents.blockNumber)
      eventsData.appealDecisionEvents.blockNumber = blockNumber

    if (!acc[_disputeID]) acc[_disputeID] = {}

    acc[_disputeID][curr.transactionHash] = {
      returnValues: curr.returnValues,
      transactionHash: curr.transactionHash,
      blockNumber: curr.blockNumber
    }
    return acc
  }, eventsData.appealDecisionEvents.events)

  JSON.stringify(eventsData)
  localStorage.setItem(
    `${arbitratorView.options.address}arbitratorData@${APP_VERSION}`,
    JSON.stringify(eventsData)
  )

  return {
    appealDecisionEvents: eventsData.appealDecisionEvents
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
