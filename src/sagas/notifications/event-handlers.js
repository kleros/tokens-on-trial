import memoizeOne from 'memoize-one'

import * as tcrConstants from '../../constants/tcr'
import { contractStatusToClientStatus } from '../../utils/tcr'
import {
  arbitrableTokenList,
  arbitrableAddressList,
  web3
} from '../../bootstrap/dapp-api'

/* eslint-disable valid-jsdoc */

// Helpers
const getBlockDate = memoizeOne(blockHash =>
  web3.eth.getBlock(blockHash).then(block => new Date(block.timestamp * 1000))
)

/**
 * Token event notification handler
 */
export const emitTokenNotifications = async (
  account,
  timeToChallenge,
  emit,
  events
) => {
  const notifiedIDs = {}
  let oldestNonDisputedSubmittedStatusEvent

  for (const event of events.reverse()) {
    const { returnValues } = event

    if (notifiedIDs[returnValues._tokenID]) continue
    const isRequester = account === returnValues._requester
    if (!isRequester && account !== returnValues._challenger) continue

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
        if (returnValues._disputed === false)
          message = `${
            isRequester
              ? 'Your token registration request'
              : 'A token registration request you challenged'
          } has been executed.`
        else
          message = `${
            isRequester
              ? 'Your challenged token registration request'
              : 'A token registration request you challenged'
          } has been executed.`
        break
      }
      case tcrConstants.IN_CONTRACT_STATUS_ENUM.Absent: {
        if (returnValues._disputed === false)
          message = `${
            isRequester
              ? 'Your token clearing request'
              : 'A token clearing request you challenged'
          } has been executed.`
        else
          message = `${
            isRequester
              ? 'Your token clearing request'
              : 'A token clearing request you challenged'
          } has been refused.`
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
      notifiedIDs[returnValues._tokenID] =
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
    notifiedIDs[oldestNonDisputedSubmittedStatusEvent.returnValues._tokenID] !==
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

/**
 * Badge event notification handler
 */
export const emitBadgeNotifications = async (
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
        if (returnValues._disputed === false)
          message = `${
            isRequester
              ? 'Your badge registration request'
              : 'A badge registration request you challenged'
          } has been executed.`
        else
          message = `${
            isRequester
              ? 'Your challenged badge registration request'
              : 'A badge registration request you challenged'
          } has been executed.`
        break
      }
      case tcrConstants.IN_CONTRACT_STATUS_ENUM.Absent: {
        if (returnValues._disputed === false)
          message = `${
            isRequester
              ? 'Your badge clearing request'
              : 'A badge clearing request you challenged'
          } has been executed.`
        else
          message = `${
            isRequester
              ? 'Your badge clearing request'
              : 'A badge clearing request you challenged'
          } has been refused.`
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
