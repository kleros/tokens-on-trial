import memoizeOne from 'memoize-one'

/* eslint-disable valid-jsdoc */

const ZERO_ID = `0x0000000000000000000000000000000000000000000000000000000000000000`
const filter = [
  false, // Do not include tokens which are not on the TCR.
  true, // Include registered tokens.
  false, // Do not include tokens with pending registration requests.
  true, // Include tokens with pending clearing requests.
  false, // Do not include tokens with challenged registration requests.
  true, // Include tokens with challenged clearing requests.
  false, // Include token if caller is the author of a pending request.
  false // Include token if caller is the challenger of a pending request.
]

// Helpers
const getBlockDate = memoizeOne((blockHash, viewWeb3) =>
  viewWeb3.eth
    .getBlock(blockHash)
    .then(block => new Date(block.timestamp * 1000))
)

/**
 * Arbitrator event notification handler
 */
const emitArbitratorNotifications = async (
  account,
  emit,
  events,
  {
    arbitratorView,
    arbitrableAddressListView,
    arbitrableTokenListView,
    viewWeb3
  }
) => {
  for (const event of events.reverse()) {
    const { returnValues } = event

    if (returnValues._arbitrable === arbitrableTokenListView._address) {
      const tokenID = await arbitrableTokenListView.methods
        .arbitratorDisputeIDToTokenID(
          arbitratorView._address,
          returnValues._disputeID
        )
        .call()

      const token = await arbitrableTokenListView.methods
        .getTokenInfo(tokenID)
        .call()
      const latestRequest = await arbitrableTokenListView.methods
        .getRequestInfo(tokenID, Number(token.numberOfRequests) - 1)
        .call()

      if (
        account !== latestRequest.parties[1] &&
        account !== latestRequest.parties[2]
      )
        continue

      const message = `Jurors gave an appealable ruling on the ${
        token.ticker
      } token.`
      emit({
        ID: tokenID,
        date: await getBlockDate(event.blockHash, viewWeb3),
        message,
        clientStatus: 4
      })
    } else if (
      returnValues._arbitrable === arbitrableAddressListView._address
    ) {
      const tokenAddress = await arbitrableAddressListView.methods
        .arbitratorDisputeIDToAddress(
          arbitratorView._address,
          returnValues._disputeID
        )
        .call()

      const addressInfo = await arbitrableAddressListView.methods
        .getAddressInfo(tokenAddress)
        .call()
      const latestRequest = await arbitrableAddressListView.methods
        .getRequestInfo(tokenAddress, Number(addressInfo.numberOfRequests) - 1)
        .call()

      if (
        account !== latestRequest.parties[1] &&
        account !== latestRequest.parties[2]
      )
        continue

      const tokenIDs = (await arbitrableTokenListView.methods
        .queryTokens(
          ZERO_ID, // A token ID from which to start/end the query from. Set to zero means unused.
          10, // Number of items to return at once.
          filter,
          true, // Return oldest first.
          tokenAddress // The token address for which to return the submissions.
        )
        .call()).values.filter(ID => ID !== ZERO_ID)

      let token
      if (tokenIDs && tokenIDs.length > 0)
        token = await arbitrableTokenListView.methods
          .getTokenInfo(tokenIDs[0])
          .call()

      const message = `Jurors gave an appealable ruling on disputed badge for ${
        token ? `the ${token.ticker}` : 'a'
      } token.`

      emit({
        ID: tokenAddress,
        addr: tokenAddress,
        badgeAddr: arbitrableAddressListView._address,
        date: await getBlockDate(event.blockHash, viewWeb3),
        message,
        clientStatus: 4
      })
    } else continue
  }

  if (events[0])
    localStorage.setItem(
      `${arbitratorView.options.address}nextEventsBlockNumber`,
      events[0].blockNumber + 1
    )
}

export default emitArbitratorNotifications
