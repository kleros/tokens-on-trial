import memoizeOne from 'memoize-one'

import * as tcrConstants from '../../constants/tcr'
import { contractStatusToClientStatus } from '../../utils/tcr'
import { arbitrableAddressList, web3 } from '../../bootstrap/dapp-api'

/* eslint-disable valid-jsdoc */

// Helpers
const getBlockDate = memoizeOne(blockHash =>
  web3.eth.getBlock(blockHash).then(block => new Date(block.timestamp * 1000))
)

/**
 * Badge event notification handler
 */
const emitBadgeNotifications = async (
  account,
  timeToChallenge,
  emit,
  events
) => {
  const notifiedIDs = {}
  let oldestNonDisputedSubmittedStatusEvent

  for (const event of events.reverse()) {
    const { returnValues } = event

    if (notifiedIDs[returnValues._address]) continue
    const isRequester = account === returnValues._requester
    if (!isRequester && account !== returnValues._challenger) continue

    const requests = await arbitrableAddressList.getPastEvents(
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
              ? 'Your badge request has been challenged.'
              : 'You challenged a badge request.'
          }`
        else if (
          returnValues._disputed === true &&
          returnValues._appealed === true &&
          isRequester
        )
          message = `${
            isRequester
              ? 'An appeal was raised on your badge request.'
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
              ? 'Your badge addition request has been accepted'
              : 'A badge addition request you challenged has been accepted.'
          }`
        else
          message = `${
            isRequester
              ? 'Your badge removal request has been rejected.'
              : 'A badge removal you challenged has been rejected.'
          }`
        break
      }
      case tcrConstants.IN_CONTRACT_STATUS_ENUM.Absent: {
        if (isRegistrationRequest)
          message = `${
            isRequester
              ? 'Your badge addition request has been rejected.'
              : 'A badge addition request you challenged has been rejected.'
          }`
        else
          message = `${
            isRequester
              ? 'Your badge removal request has been accepted.'
              : 'A badge removal request you challenged has been accepted.'
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
      notifiedIDs[returnValues._address] =
        returnValues._disputed === true &&
        (returnValues._status ===
          tcrConstants.IN_CONTRACT_STATUS_ENUM.RegistrationRequested ||
          returnValues._status ===
            tcrConstants.IN_CONTRACT_STATUS_ENUM.ClearingRequested)
          ? 'disputed'
          : true

      emit({
        ID: returnValues._address,
        addr: returnValues._address,
        badgeAddr: arbitrableAddressList._address,
        date: await getBlockDate(event.blockHash),
        message,
        clientStatus
      })
    }
  }

  if (
    oldestNonDisputedSubmittedStatusEvent &&
    notifiedIDs[oldestNonDisputedSubmittedStatusEvent.returnValues._address] !==
      'disputed'
  ) {
    const date = await getBlockDate(
      oldestNonDisputedSubmittedStatusEvent.blockHash
    )
    if (timeToChallenge && Date.now() - date > timeToChallenge)
      emit({
        ID: oldestNonDisputedSubmittedStatusEvent.returnValues._address,
        addr: oldestNonDisputedSubmittedStatusEvent.returnValues._address,
        date,
        badgeAddr: arbitrableAddressList._address,
        message: 'Badge request pending execution.',
        clientStatus: oldestNonDisputedSubmittedStatusEvent.returnValues._status
      })
  }

  if (events[0])
    localStorage.setItem(
      `${arbitrableAddressList.options.address}nextEventsBlockNumber`,
      events[0].blockNumber + 1
    )
}

export default emitBadgeNotifications
