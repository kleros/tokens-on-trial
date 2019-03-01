import memoizeOne from 'memoize-one'

import {
  arbitrator,
  arbitrableAddressList,
  arbitrableTokenList,
  web3
} from '../../bootstrap/dapp-api'

/* eslint-disable valid-jsdoc */

// Helpers
const getBlockDate = memoizeOne(blockHash =>
  web3.eth.getBlock(blockHash).then(block => new Date(block.timestamp * 1000))
)

/**
 * Arbitrator event notification handler
 */
const emitArbitratorNotifications = async (account, emit, events) => {
  for (const event of events.reverse()) {
    const { returnValues } = event

    if (returnValues._arbitrable !== arbitrableTokenList._address) {
      const tokenID = await arbitrableTokenList.methods.arbitratorDisputeIDToTokenID(
        arbitrator._address,
        returnValues._disputeID
      )
      const token = await arbitrableTokenList.methods.getTokenInfo(tokenID)
      const latestRequest = await arbitrableTokenList.methods.getRequestInfo(
        tokenID,
        Number(token.numberOfRequests) - 1
      )
      if (
        account !== latestRequest.parties[1] &&
        account !== latestRequest.parties[2]
      )
        continue

      const message =
        'The arbitrator gave an appealable ruling on a disputed token.'
      emit({
        ID: tokenID,
        date: await getBlockDate(event.blockHash),
        message,
        clientStatus: 4
      })
    } else if (returnValues._arbitrable !== arbitrableAddressList._address) {
      const tokenAddress = await arbitrableAddressList.methods.arbitratorDisputeIDToAddress(
        arbitrator._address,
        returnValues._disputeID
      )
      const message =
        'The arbitrator gave an appealable ruling on a disputed badge.'

      emit({
        ID: tokenAddress,
        badgeAddr: arbitrableAddressList._address,
        date: await getBlockDate(event.blockHash),
        message,
        clientStatus: 4
      })
    } else continue
  }

  if (events[0])
    localStorage.setItem(
      `${arbitrator.options.address}nextEventsBlockNumber`,
      events[0].blockNumber + 1
    )
}

export default emitArbitratorNotifications
