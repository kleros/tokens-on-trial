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

/**
 * Token event notification handler
 */
const emitTokenNotifications = async (
  account,
  timeToChallenge,
  emit,
  events,
  { arbitrableTokenListView, T2CR_BLOCK, viewWeb3 }
) => {
  const notifiedTxs = {}
  let oldestNonDisputedSubmittedStatusEvent

  for (const event of events.reverse()) {
    const { returnValues, transactionHash } = event

    if (notifiedTxs[transactionHash]) continue
    const isRequester = account === returnValues._requester
    if (!isRequester && account !== returnValues._challenger) continue

    const requests = await arbitrableTokenListView.getPastEvents(
      'RequestSubmitted',
      {
        filter: { _tokenID: returnValues._tokenID },
        fromBlock: T2CR_BLOCK,
        toBlock: 'latest'
      }
    )

    const token = await arbitrableTokenListView.methods
      .getTokenInfo(returnValues._tokenID)
      .call()

    const isRegistrationRequest =
      requests[requests.length - 1].returnValues._registrationRequest

    let message
    let successMessage // Whether the user receiving a notification was won/succeded in a dispute/request.
    switch (Number(returnValues._status)) {
      case tcrConstants.IN_CONTRACT_STATUS_ENUM.RegistrationRequested:
        if (
          returnValues._disputed === true &&
          returnValues._appealed === false &&
          isRequester
        )
          message = `${token.ticker} token submission challenged.`
        else if (
          returnValues._disputed === true &&
          returnValues._appealed === true &&
          isRequester
        )
          message = `Appeal raised on ${token.ticker} token submission.`
        else if (returnValues._disputed === false)
          oldestNonDisputedSubmittedStatusEvent = event
        break
      case tcrConstants.IN_CONTRACT_STATUS_ENUM.ClearingRequested: {
        if (
          returnValues._disputed === true &&
          returnValues._appealed === false &&
          isRequester
        )
          message = `${token.ticker} token delisting challenged.`
        else if (
          returnValues._disputed === true &&
          returnValues._appealed === true &&
          isRequester
        )
          message = `${token.ticker} token delisting appealed.`
        else if (returnValues._disputed === false)
          oldestNonDisputedSubmittedStatusEvent = event
        break
      }
      case tcrConstants.IN_CONTRACT_STATUS_ENUM.Registered: {
        if (isRegistrationRequest) {
          message = `${
            isRequester
              ? `${token.ticker} token submission successful.`
              : `Jurors ruled against you on ${token.ticker} token.`
          }`
          successMessage = isRequester
        } else {
          message = `${
            isRequester
              ? `Jurors ruled against you on ${token.ticker} token.`
              : `Jurors ruled in your favor on ${token.ticker} token.`
          }`
          successMessage = !isRequester
        }
        break
      }
      case tcrConstants.IN_CONTRACT_STATUS_ENUM.Absent: {
        if (isRegistrationRequest) {
          message = `${
            isRequester
              ? `Jurors ruled against you on ${token.ticker} token.`
              : `Jurors ruled in your favor on ${token.ticker} token.`
          }`
          successMessage = !isRequester
        } else {
          message = `${
            isRequester
              ? `${token.ticker} token delisting successful.`
              : `Jurors ruled against you on ${token.ticker} token.`
          }`
          successMessage = isRequester
        }
        break
      }
      default: {
        console.warn('Unhandled notification: ', returnValues)
        console.warn('isRequester', isRequester)
        console.warn('account', account)
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
          ? 'disputed'
          : true

      emit({
        ID: returnValues._tokenID,
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
      'disputed'
  ) {
    const date = await getBlockDate(
      oldestNonDisputedSubmittedStatusEvent.blockHash,
      viewWeb3
    )
    if (timeToChallenge && Date.now() - date > timeToChallenge)
      emit({
        ID: oldestNonDisputedSubmittedStatusEvent.returnValues._tokenID,
        date,
        message: 'Token request pending execution.',
        clientStatus: oldestNonDisputedSubmittedStatusEvent.returnValues._status
      })
  }

  if (events[0])
    localStorage.setItem(
      `${arbitrableTokenListView.options.address}nextEventsBlockNumber`,
      events[0].blockNumber + 1
    )
}

export default emitTokenNotifications
