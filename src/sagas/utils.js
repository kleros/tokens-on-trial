import { call } from 'redux-saga/effects'

import { PERIOD } from '../constants/arbitrator'

export const fetchEvents = async (eventName, fromBlock, contract) =>
  contract.getPastEvents(eventName, { fromBlock })

/**
 * Fetches a list dispute IDs of items in the appeal period.
 * @param {object} arbitratorView - The arbitrator contract instance.
 * @param {number} ARBITRATOR_BLOCK - The arbitrator contract deployment block.
 * @param {object} tcrView - The tcr contract instance.
 * @returns {Array} tcrView - The tcr contract instance.
 */
export function* fetchAppealable(arbitratorView, ARBITRATOR_BLOCK, tcrView) {
  const tcrAppealableEvents = (yield call(
    fetchEvents,
    'AppealPossible',
    ARBITRATOR_BLOCK,
    arbitratorView
  ))
    .filter(e => e.returnValues._arbitrable === tcrView._address)
    .reduce((acc, curr) => {
      if (!acc[curr.returnValues._disputeID])
        acc[curr.returnValues._disputeID] = curr
      // Take the most recent appeal possible event.
      else
        acc[curr.returnValues._disputeID] =
          curr.blockNumber > acc[curr.returnValues._disputeID].blockNumber
            ? curr
            : acc[curr.returnValues._disputeID]

      return acc
    }, {})

  const tcrPeriodChangeEvents = (yield call(
    fetchEvents,
    'NewPeriod',
    ARBITRATOR_BLOCK,
    arbitratorView
  ))
    .filter(e => !!tcrAppealableEvents[e.returnValues._disputeID]) // Remove disputes unrelated to the tcr
    .reduce((acc, curr) => {
      // Take the most recent period change event for each dispute.
      if (!acc[curr.returnValues._disputeID])
        acc[curr.returnValues._disputeID] = curr
      else
        acc[curr.returnValues._disputeID] =
          curr.blockNumber > acc[curr.returnValues._disputeID].blockNumber
            ? curr
            : acc[curr.returnValues._disputeID]

      return acc
    }, {})

  // Remove events of items not in the appeal period.
  const itemsInAppealPeriod = Object.keys(tcrAppealableEvents)
    .map(disputeID => tcrAppealableEvents[disputeID])
    .filter(
      e =>
        tcrPeriodChangeEvents[e.returnValues._disputeID].returnValues
          ._period === PERIOD.Appeal.toString()
    ) // Take only period changes that enter the appeal period.
    .map(e => e.returnValues._disputeID)

  return itemsInAppealPeriod
}
