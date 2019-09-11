import { call } from 'redux-saga/effects'

export const fetchEvents = async (
  eventName,
  contract,
  fromBlock = 0,
  web3,
  blocksPerRequest = 200000
) => {
  fromBlock = Number(fromBlock)
  const latestBlockNumber = (await web3.eth.getBlock('latest')).number
  const rounds = Math.ceil((latestBlockNumber - fromBlock) / blocksPerRequest)

  const promises = []
  for (let round = 0; round < rounds; round++) {
    const startBlock = fromBlock + round * blocksPerRequest
    const endBlock =
      startBlock + blocksPerRequest < latestBlockNumber
        ? startBlock + blocksPerRequest
        : latestBlockNumber
    promises.push(
      contract.getPastEvents(eventName, {
        fromBlock: startBlock,
        toBlock: endBlock
      })
    )
  }
  const logBatches = await Promise.all(promises)
  let events = []
  logBatches.forEach(logBatch => {
    events = events.concat(logBatch)
  })
  return events
}

/**
 * Fetches a list dispute IDs of items which are within appeal period. Does not exclude disputes of appeals that did not receive enough funds from the loser in the first half of the appeal period.
 * @param {object} tcrView - The tcr contract instance.
 * @param {object} arbitrableTCRView - A view contract to batch transactions.
 * @returns {object} An mappping of dispute IDs within the appeal period to the appeal period interval.
 */
export function* fetchAppealableAddresses(tcrView, arbitrableTCRView) {
  const returnedItems = (yield call(
    arbitrableTCRView.methods.fetchAppealableAddresses(
      tcrView.options.address,
      0,
      2000
    ).call
  ))
    .filter(item => item.disputeID !== '0')
    .filter(item => item.inAppealPeriod)
    .reduce((acc, curr) => ({ ...acc, [curr.addr]: curr }), {})

  return returnedItems
}

/**
 * Fetches a list dispute IDs of items which are within appeal period. Does not exclude disputes of appeals that did not receive enough funds from the loser in the first half of the appeal period.
 * @param {object} tcrView - The tcr contract instance.
 * @param {object} arbitrableTCRView - A view contract to batch transactions.
 * @returns {object} An mappping of dispute IDs within the appeal period to the appeal period interval.
 */
export function* fetchAppealableTokens(tcrView, arbitrableTCRView) {
  const returnedItems = (yield call(
    arbitrableTCRView.methods.fetchAppealableToken(
      tcrView.options.address,
      0,
      2000
    ).call
  ))
    .filter(item => item.disputeID !== '0')
    .filter(item => item.inAppealPeriod)
    .reduce((acc, curr) => ({ ...acc, [curr.tokenID]: curr }), {})

  return returnedItems
}
