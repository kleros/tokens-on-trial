import memoizeOne from 'memoize-one'

import * as tcrConstants from '../../constants/tcr'
import { contractStatusToClientStatus } from '../../utils/tcr'

/* eslint-disable valid-jsdoc */

// Helpers
const getBlockDate = memoizeOne((blockHash, viewWeb3) =>
  viewWeb3.eth
    .getBlock(blockHash)
    .then(block => new Date(block.timestamp * 1000))
)

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

/**
 * Badge event notification handler
 */
const emitBadgeNotifications = async (
  account,
  timeToChallenge,
  emit,
  events,
  {
    arbitrableAddressListView,
    arbitrableTokenListView,
    viewWeb3,
    ETHFINEX_BADGE_BLOCK
  }
) => {
  const notifiedTxs = {}
  let oldestNonDisputedSubmittedStatusEvent

  for (const event of events.reverse()) {
    const { returnValues, transactionHash } = event

    if (notifiedTxs[transactionHash]) continue
    const isRequester = account === returnValues._requester
    if (!isRequester && account !== returnValues._challenger) continue

    let requests = []
    try {
      requests = await arbitrableAddressListView.getPastEvents(
        `RequestSubmitted`,
        {
          filter: { _address: returnValues._address },
          fromBlock: ETHFINEX_BADGE_BLOCK,
          toBlock: `latest`
        }
      )
    } catch (err) {
      console.error(err)
      continue
    }

    if (requests.length === 0) continue

    const tokenIDs = (await arbitrableTokenListView.methods
      .queryTokens(
        ZERO_ID, // A token ID from which to start/end the query from. Set to zero means unused.
        10, // Number of items to return at once.
        filter,
        true, // Return oldest first.
        returnValues._address // The token address for which to return the submissions.
      )
      .call()).values.filter(ID => ID !== ZERO_ID)

    let token
    if (tokenIDs && tokenIDs.length > 0) {
      token = await arbitrableTokenListView.methods
        .getTokenInfo(tokenIDs[0])
        .call()
      token.address = token.addr
    }

    const isRegistrationRequest =
      requests[requests.length - 1].returnValues._registrationRequest

    let message
    let successMessage
    switch (Number(returnValues._status)) {
      case tcrConstants.IN_CONTRACT_STATUS_ENUM.RegistrationRequested: {
        if (
          returnValues._disputed === true &&
          returnValues._appealed === false &&
          isRequester
        )
          message = `${
            token ? `${token.ticker} b` : 'B'
          }adge addition challenged.`
        else if (
          returnValues._disputed === true &&
          returnValues._appealed === true &&
          isRequester
        )
          message = `${
            token ? `${token.ticker} b` : 'B'
          }adge addition appealed.`
        else if (returnValues._disputed === false)
          oldestNonDisputedSubmittedStatusEvent = event
        break
      }
      case tcrConstants.IN_CONTRACT_STATUS_ENUM.ClearingRequested: {
        if (
          returnValues._disputed === true &&
          returnValues._appealed === false &&
          isRequester
        )
          message = `${
            token ? `${token.ticker} b` : 'B'
          }adge removal challenged.`
        else if (
          returnValues._disputed === true &&
          returnValues._appealed === true &&
          isRequester
        )
          message = `${token ? `${token.ticker} b` : 'B'}adge removal appealed.`
        else if (returnValues._disputed === false)
          oldestNonDisputedSubmittedStatusEvent = event
        break
      }
      case tcrConstants.IN_CONTRACT_STATUS_ENUM.Registered: {
        if (isRegistrationRequest) {
          message = `${
            isRequester
              ? `${token ? `${token.ticker} b` : 'B'}adge addition successful.`
              : `Jurors ruled against you on ${
                  token ? `${token.ticker}` : 'the'
                } badge challenge.`
          }`
          successMessage = isRequester
        } else {
          message = `${
            isRequester
              ? `Jurors ruled against you on ${
                  token ? `${token.ticker}` : 'the'
                } badge removal.`
              : `Jurors ruled in your favor on ${
                  token ? `${token.ticker}` : 'the'
                } badge challenge.`
          }`
          successMessage = !isRequester
        }
        break
      }
      case tcrConstants.IN_CONTRACT_STATUS_ENUM.Absent: {
        if (isRegistrationRequest) {
          message = `${
            isRequester
              ? `Jurors ruled against you on ${
                  token ? `${token.ticker}` : 'the'
                } badge addition.`
              : `Jurors ruled in your favor on ${
                  token ? `${token.ticker}` : 'the'
                } badge challenge.`
          }`
          successMessage = !isRequester
        } else {
          message = `${
            isRequester
              ? `${token ? `${token.ticker} b` : 'B'}adge removal successful.`
              : `Jurors ruled against you on ${
                  token ? `${token.ticker}` : 'the'
                } badge challenge.`
          }`
          successMessage = isRequester
        }
        break
      }
      default: {
        console.warn(`Unhandled notification: `, returnValues)
        console.warn(`isRequester`, isRequester)
        console.warn(`account`, account)
        break
      }
    }

    const clientStatus = contractStatusToClientStatus(
      returnValues._status,
      returnValues._disputed
    )

    if (message) {
      notifiedTxs[transactionHash] =
        returnValues._disputed === true &&
        (returnValues._status ===
          tcrConstants.IN_CONTRACT_STATUS_ENUM.RegistrationRequested ||
          returnValues._status ===
            tcrConstants.IN_CONTRACT_STATUS_ENUM.ClearingRequested)
          ? `disputed`
          : true

      emit({
        ID: returnValues._address,
        address: returnValues._address,
        badgeAddr: arbitrableAddressListView._address,
        date: await getBlockDate(event.blockHash, viewWeb3),
        message,
        clientStatus,
        successMessage
      })
    }
  }

  if (
    oldestNonDisputedSubmittedStatusEvent &&
    notifiedTxs[oldestNonDisputedSubmittedStatusEvent.transactionHash] !==
      `disputed`
  ) {
    const date = await getBlockDate(
      oldestNonDisputedSubmittedStatusEvent.blockHash,
      viewWeb3
    )
    if (timeToChallenge && Date.now() - date > timeToChallenge)
      emit({
        ID: oldestNonDisputedSubmittedStatusEvent.returnValues._address,
        address: oldestNonDisputedSubmittedStatusEvent.returnValues._address,
        date,
        badgeAddr: arbitrableAddressListView._address,
        message: `Badge request pending execution.`,
        clientStatus: oldestNonDisputedSubmittedStatusEvent.returnValues._status
      })
  }

  if (events[0])
    localStorage.setItem(
      `${arbitrableAddressListView.options.address}nextEventsBlockNumber`,
      events[0].blockNumber + 1
    )
}

export default emitBadgeNotifications
