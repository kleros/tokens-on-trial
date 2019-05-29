import { call, takeLatest } from 'redux-saga/effects'

import * as arbitratorActions from '../actions/arbitrator'
import { lessduxSaga } from '../utils/saga'
import { instantiateEnvObjects } from '../utils/tcr'
import { APP_VERSION } from '../bootstrap/dapp-api'

const fetchEvents = async (eventName, contract, fromBlock) =>
  contract.getPastEvents(eventName, { fromBlock: fromBlock || 0 }) // Web3js returns an empty array if fromBlock is not set.

/**
 * Fetches the arbitrators's data.
 * @param {{ type: string, payload: ?object, meta: ?object }} action - The action object.
 * @returns {object} - The fetched data.
 */
export function* fetchArbitratorData() {
  const { arbitratorView, ARBITRATOR_BLOCK } = yield call(instantiateEnvObjects)

  let eventsData = {
    appealPossibleEvents: {
      blockNumber: Number(ARBITRATOR_BLOCK),
      events: {}
    },
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

  eventsData.appealPossibleEvents.events = (yield call(
    fetchEvents,
    'AppealPossible',
    arbitratorView,
    eventsData.appealPossibleEvents.blockNumber
  )).reduce((acc, curr) => {
    const {
      returnValues: { _disputeID },
      blockNumber
    } = curr

    if (blockNumber > eventsData.appealPossibleEvents.blockNumber)
      eventsData.appealPossibleEvents.blockNumber = blockNumber

    acc[_disputeID] = curr
    return acc
  }, eventsData.appealPossibleEvents.events)

  eventsData.appealDecisionEvents.events = (yield call(
    fetchEvents,
    'AppealPossible',
    arbitratorView,
    eventsData.appealDecisionEvents.blockNumber
  )).reduce((acc, curr) => {
    const {
      returnValues: { _disputeID },
      blockNumber
    } = curr

    if (blockNumber > eventsData.appealDecisionEvents.blockNumber)
      eventsData.appealDecisionEvents.blockNumber = blockNumber

    acc[_disputeID] = curr
    return acc
  }, eventsData.appealDecisionEvents.events)

  JSON.stringify(eventsData)
  localStorage.setItem(
    `${arbitratorView.options.address}arbitratorData@${APP_VERSION}`,
    JSON.stringify(eventsData)
  )

  return {
    appealPossibleEvents: eventsData.appealPossibleEvents,
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
