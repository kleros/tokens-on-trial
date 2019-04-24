import { call } from 'redux-saga/effects'

export const fetchEvents = async (eventName, fromBlock, contract) =>
  contract.getPastEvents(eventName, { fromBlock })

/**
 * Fetches a list dispute IDs of items which are within appeal period. Does not exclude disputes of appeals that did not receive enough funds from the loser in the first half of the appeal period.
 * @param {object} arbitratorView - The arbitrator contract instance.
 * @param {number} ARBITRATOR_BLOCK - The arbitrator contract deployment block.
 * @param {object} tcrView - The tcr contract instance.
 * @returns {object} An mappping of dispute IDs within the appeal period to the appeal period interval.
 */
export function* fetchAppealable(arbitratorView, ARBITRATOR_BLOCK, tcrView) {
  // We use AppealPossible, NewPeriod and AppealDecision events to find all
  // disputes with Period.Appeal state at once.
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

  // In the current version of KlerosLiquid, NewPeriod is not emitted when
  // a dispute enters the evidence period due to an appeal being raised
  // and so it can't be used to reliably to track the latest period of disputes.
  // We work around this by using the AppealDecision events, which are
  // emited when an appeal is raised.
  const appealDecisionEvents = (yield call(
    fetchEvents,
    'AppealDecision',
    ARBITRATOR_BLOCK,
    arbitratorView
  ))
    .filter(e => e.returnValues._arbitrable === tcrView._address) // Remove disputes unrelated to the tcr
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

  const tcrPeriodChangeEvents = Object.keys(
    (yield call(fetchEvents, 'NewPeriod', ARBITRATOR_BLOCK, arbitratorView))
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
  )
    .map(disputeID => tcrAppealableEvents[disputeID])
    .filter(
      e =>
        !appealDecisionEvents[e.returnValues._disputeID] || // Remove events from disputes which were succesfully appealed.
        e.blockNumber >
          appealDecisionEvents[e.returnValues._disputeID].blockNumber
    )
    .reduce((acc, curr) => {
      acc[curr.returnValues._disputeID] = curr
      return acc
    }, {})

  // A dispute can have its `period` status as `appeal` but not be appealable
  // anymore if the current time is greater then the appeal period end time.
  // Remove all items which fall under this category.
  const returnedItems = {}
  for (let i = 0; i < Object.keys(tcrPeriodChangeEvents).length; i++) {
    const disputeID = Object.keys(tcrPeriodChangeEvents)[i]

    const appealPeriodObj = yield call(
      arbitratorView.methods.appealPeriod(disputeID).call
    )
    const appealPeriod = [
      Number(appealPeriodObj.start),
      Number(appealPeriodObj.end)
    ]

    if (
      appealPeriod[1] === 0 ||
      Date.now() > appealPeriod[1] * 1000 // Convert to milliseconds.
    )
      delete tcrPeriodChangeEvents[disputeID]
    else returnedItems[disputeID] = appealPeriod
  }

  return returnedItems
}
