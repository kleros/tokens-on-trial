import memoizeOne from 'memoize-one'

import * as tcrConstants from '../../constants/tcr'
import { contractStatusToClientStatus } from '../../utils/tcr'
import { arbitrableTokenList, web3 } from '../../bootstrap/dapp-api'

/* eslint-disable valid-jsdoc */

// Helpers
const getBlockDate = memoizeOne(blockHash =>
  web3.eth.getBlock(blockHash).then(block => new Date(block.timestamp * 1000))
)

/**
 * Token event notification handler
 */
const emitTokenNotifications = async (
  account,
  timeToChallenge,
  emit,
  events
) => {
  const notifiedTxs = {}
  let oldestNonDisputedSubmittedStatusEvent

  for (const event of events.reverse()) {
    const { returnValues, transactionHash } = event

    if (notifiedTxs[transactionHash]) continue
    const isRequester = account === returnValues._requester
    if (!isRequester && account !== returnValues._challenger) continue

    const requests = await arbitrableTokenList.getPastEvents(
      'RequestSubmitted',
      {
        filter: { _tokenID: returnValues._tokenID },
        fromBlock: 0,
        toBlock: 'latest'
      }
    )

    const isRegistrationRequest =
      requests[requests.length - 1].returnValues._registrationRequest

    let message
    switch (Number(returnValues._status)) {
      case tcrConstants.IN_CONTRACT_STATUS_ENUM.RegistrationRequested:
      case tcrConstants.IN_CONTRACT_STATUS_ENUM.ClearingRequested: {
        if (
          returnValues._disputed === true &&
          returnValues._appealed === false &&
          isRequester
        )
          message = `${
            isRequester
              ? 'Your token request has been challenged.'
              : 'You challenged a token request.'
          }`
        else if (
          returnValues._disputed === true &&
          returnValues._appealed === true &&
          isRequester
        )
          message = `${
            isRequester
              ? 'An appeal was raised on your token request.'
              : 'An appeal was raised on a request you challenged.'
          }`
        else if (returnValues._disputed === false)
          oldestNonDisputedSubmittedStatusEvent = event
        break
      }
      case tcrConstants.IN_CONTRACT_STATUS_ENUM.Registered: {
        if (isRegistrationRequest)
          message = `${
            isRequester
              ? 'Your token submission was accepted.'
              : 'A token submission you challenged was accepted.'
          }`
        else
          message = `${
            isRequester
              ? 'Your token delisting request has been rejected.'
              : 'A token delisting request you challenged was rejected.'
          }`

        break
      }
      case tcrConstants.IN_CONTRACT_STATUS_ENUM.Absent: {
        if (isRegistrationRequest)
          message = `${
            isRequester
              ? 'Your token submission has been rejected.'
              : 'A token submission you challenged has been rejected'
          }`
        else
          message = `${
            isRequester
              ? 'Your token delisting request has been accepted.'
              : 'A token delisting you challenged has been accepted.'
          }`
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
        date: await getBlockDate(event.blockHash),
        message,
        clientStatus
      })
    }
  }

  if (
    oldestNonDisputedSubmittedStatusEvent &&
    notifiedTxs[oldestNonDisputedSubmittedStatusEvent.transactionHash] !==
      'disputed'
  ) {
    const date = await getBlockDate(
      oldestNonDisputedSubmittedStatusEvent.blockHash
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
      `${arbitrableTokenList.options.address}nextEventsBlockNumber`,
      events[0].blockNumber + 1
    )
}

export default emitTokenNotifications
