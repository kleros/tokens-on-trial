/* eslint-disable react/prop-types */
import React from 'react'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'

import Button from '../button'
import * as modalConstants from '../../constants/modal'
import * as tcrConstants from '../../constants/tcr'
import { hasPendingRequest, isRegistrationRequest } from '../../utils/tcr'

const getActionButton = ({
  item,
  userAccount,
  tcr,
  countdownCompleted,
  handleActionClick,
  handleExecuteRequestClick
}) => {
  let method
  let disabled = true
  let label = 'Loading...'
  let icon = 'spinner'

  if (!item || !tcr.data || item.creating || item.updating)
    return (
      <Button disabled style={{ cursor: 'not-allowed' }} type="primary">
        <FontAwesomeIcon className="TokenDetails-icon" icon={icon} />
        {label}
      </Button>
    )

  const challengePeriodDuration = Number(tcr.data.challengePeriodDuration)
  const arbitrationFeesWaitingTime = Number(tcr.data.arbitrationFeesWaitingTime)
  const { latestRequest } = item
  const { latestRound, challengerDepositTime } = latestRequest
  let submitterFees
  let challengerFees
  if (latestRequest && latestRound) {
    submitterFees = latestRound.paidFees[tcrConstants.SIDE.Requester]
    challengerFees = latestRound.paidFees[tcrConstants.SIDE.Challenger]
  }

  if (hasPendingRequest(item))
    if (latestRequest.disputed && !latestRequest.resolved) {
      icon = 'hourglass-half'
      disabled = true
      label = 'Waiting Arbitration'
      if (
        Number(latestRequest.dispute.status) ===
          tcrConstants.DISPUTE_STATUS.Appealable &&
        !latestRound.appealed
      )
        if (
          userAccount === latestRequest.parties[tcrConstants.SIDE.Requester] ||
          userAccount === latestRequest.parties[tcrConstants.SIDE.Challenger]
        ) {
          const appealPeriodStart = Number(
            latestRequest.latestRound.appealPeriod[0]
          )
          const appealPeriodEnd = Number(
            latestRequest.latestRound.appealPeriod[1]
          )
          const appealPeriodDuration = appealPeriodEnd - appealPeriodStart
          const endOfFirstHalf = appealPeriodStart + appealPeriodDuration / 2
          if (Date.now() < appealPeriodEnd) {
            const SIDE =
              userAccount === latestRequest.parties[tcrConstants.SIDE.Requester]
                ? tcrConstants.SIDE.Requester
                : tcrConstants.SIDE.Challenger

            if (
              latestRound.requiredForSide[SIDE] === 0 ||
              latestRound.paidFees[SIDE] < latestRound.requiredForSide[SIDE]
            ) {
              let losingSide
              if (
                userAccount ===
                  latestRequest.parties[tcrConstants.SIDE.Requester] &&
                latestRequest.dispute.ruling ===
                  tcrConstants.RULING_OPTIONS.Refuse.toString()
              )
                losingSide = true
              else if (
                userAccount ===
                  latestRequest.parties[tcrConstants.SIDE.Challenger] &&
                latestRequest.dispute.ruling ===
                  tcrConstants.RULING_OPTIONS.Accept.toString()
              )
                losingSide = true

              if (!losingSide) {
                label = 'Fund Appeal'
                disabled = false
                method = () =>
                  handleActionClick(
                    modalConstants.ACTION_MODAL_ENUM.FundAppeal,
                    SIDE
                  )
              } else if (Date.now() < endOfFirstHalf) {
                label = 'Fund Appeal'
                disabled = false
                method = () =>
                  handleActionClick(
                    modalConstants.ACTION_MODAL_ENUM.FundAppeal,
                    SIDE
                  )
              }
            } else label = 'Waiting For Opponent Fees'
          } else if (Date.now() > appealPeriodEnd) label = 'Waiting Enforcement'
        } else if (!countdownCompleted) label = 'Waiting Appeals'
    } else if (
      submitterFees > 0 &&
      challengerFees > 0 &&
      Date.now() > challengerDepositTime + arbitrationFeesWaitingTime
    ) {
      icon = 'gavel'
      disabled = false
      method = handleExecuteRequestClick
      if (submitterFees > challengerFees) label = 'Timeout Challenger'
      else label = 'Timeout Submitter'
    } else if (
      Date.now() >= latestRequest.submissionTime + challengePeriodDuration ||
      countdownCompleted
    ) {
      method = handleExecuteRequestClick
      icon = 'check'
      disabled = false
      label = 'Execute Request'
    } else if (
      challengerDepositTime > 0 &&
      Date.now() - challengerDepositTime < arbitrationFeesWaitingTime &&
      (userAccount === latestRequest.parties[tcrConstants.SIDE.Requester] ||
        userAccount === latestRequest.parties[tcrConstants.SIDE.Challenger])
    ) {
      icon = 'gavel'
      label = 'Pay Arbitration Fees'
      disabled = false
      if (
        challengerFees > submitterFees &&
        userAccount === latestRequest.parties[tcrConstants.SIDE.Requester]
      )
        method = () =>
          handleActionClick(modalConstants.ACTION_MODAL_ENUM.FundRequester)
      else if (
        submitterFees > challengerFees &&
        userAccount === latestRequest.parties[tcrConstants.SIDE.Challenger]
      )
        method = () =>
          handleActionClick(modalConstants.ACTION_MODAL_ENUM.FundChallenger)
      else {
        icon = 'hourglass-half'
        label = 'Waiting Requester Fees'
        disabled = true
      }
    } else if (
      userAccount === latestRequest.parties[tcrConstants.SIDE.Requester]
    ) {
      icon = 'hourglass-half'
      disabled = true
      label = 'Waiting Challenges'
    } else {
      icon = 'gavel'
      disabled = false
      method = () =>
        handleActionClick(modalConstants.ACTION_MODAL_ENUM.Challenge)
      if (isRegistrationRequest(item.status)) label = 'Challenge Registration'
      else label = 'Challenge Clearing'
    }
  else {
    disabled = false
    if (item.status === tcrConstants.IN_CONTRACT_STATUS_ENUM['Registered']) {
      method = () => handleActionClick(modalConstants.ACTION_MODAL_ENUM.Clear)
      label = 'Submit Clearing Request'
      icon = 'times-circle'
    } else {
      label = 'Resubmit Token'
      icon = 'plus'
      method = () =>
        handleActionClick(modalConstants.ACTION_MODAL_ENUM.Resubmit)
    }
  }

  return (
    <Button
      disabled={disabled}
      onClick={method}
      style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
      type="primary"
    >
      <FontAwesomeIcon className="TokenDetails-icon" icon={icon} />
      {label}
    </Button>
  )
}

export default getActionButton
