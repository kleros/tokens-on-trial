/* eslint-disable react/prop-types */
import React from 'react'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import Button from '../button'
import * as modalConstants from '../../constants/modal'
import * as tcrConstants from '../../constants/tcr'
import { onlyInfura, web3Utils } from '../../bootstrap/dapp-api'
import { hasPendingRequest, isRegistrationRequest } from '../../utils/tcr'

const ZERO_ADDR = '0x0000000000000000000000000000000000000000'
const { toBN } = web3Utils

const ETHFINEX_BADGE = {
  1: '0x916deaB80DFbc7030277047cD18B233B3CE5b4Ab',
  42: '0xd58BDd286E8155b6223e2A62932AE3e0A9A75759',
}

const getActionButton = ({
  item,
  userAccount,
  tcr,
  handleActionClick,
  handleExecuteRequestClick,
  badgeContractAddr,
  decisiveRuling,
  loserPercent,
  loserTimedOut,
}) => {
  let method
  let disabled = true
  let label = 'Loading...'
  let icon = 'spinner'
  let actionTooltip
  let hidden = false

  if (!item || !tcr || item.creating || item.updating)
    return (
      <Button disabled style={{ cursor: 'not-allowed' }} type="primary">
        <FontAwesomeIcon className="TokenDetails-icon" icon={icon} />
        {label}
      </Button>
    )

  if (decisiveRuling && loserPercent < 100 && loserTimedOut)
    return (
      <Button disabled style={{ cursor: 'not-allowed' }} type="primary">
        <FontAwesomeIcon className="TokenDetails-icon" icon="gavel" />
        Waiting Enforcement
      </Button>
    )

  const { challengePeriodDuration } = tcr
  const { latestRequest } = item
  const { latestRound } = latestRequest
  let submitterFees = toBN(0)
  let challengerFees = toBN(0)
  if (latestRequest && latestRound) {
    submitterFees = toBN(latestRound.paidFees[tcrConstants.SIDE.Requester])
    challengerFees = toBN(latestRound.paidFees[tcrConstants.SIDE.Challenger])
  }

  if (hasPendingRequest(item))
    if (latestRequest.disputed && !latestRequest.resolved) {
      icon = 'hourglass-half'
      disabled = true
      label = 'Awaiting Arbitration'
      if (
        latestRequest.dispute.status ===
          tcrConstants.DISPUTE_STATUS.Appealable &&
        !latestRound.appealed
      ) {
        const appealPeriodStart = latestRequest.latestRound.appealPeriod[0]
        const appealPeriodEnd = latestRequest.latestRound.appealPeriod[1]
        const appealPeriodDuration = appealPeriodEnd - appealPeriodStart
        const endOfFirstHalf = appealPeriodStart + appealPeriodDuration / 2
        const { appealCost } = latestRound
        const payableValue =
          !appealCost || (appealCost && appealCost.length < 25) // Contract can return unpayable value to denote that a ruling is not appealable.
        if (
          (userAccount === latestRequest.parties[tcrConstants.SIDE.Requester] ||
            userAccount ===
              latestRequest.parties[tcrConstants.SIDE.Challenger]) &&
          payableValue
        ) {
          if (Date.now() < appealPeriodEnd) {
            const SIDE =
              userAccount === latestRequest.parties[tcrConstants.SIDE.Requester]
                ? tcrConstants.SIDE.Requester
                : tcrConstants.SIDE.Challenger

            if (
              latestRound.requiredForSide[SIDE].eq(toBN(0)) ||
              latestRound.paidFees[SIDE].lt(latestRound.requiredForSide[SIDE])
            ) {
              let losingSide
              if (
                userAccount ===
                  latestRequest.parties[tcrConstants.SIDE.Requester] &&
                latestRequest.dispute.ruling ===
                  tcrConstants.RULING_OPTIONS.Refuse
              )
                losingSide = true
              else if (
                userAccount ===
                  latestRequest.parties[tcrConstants.SIDE.Challenger] &&
                latestRequest.dispute.ruling ===
                  tcrConstants.RULING_OPTIONS.Accept
              )
                losingSide = true

              if (!losingSide && payableValue) {
                label = 'Contribute Fees'
                disabled = false
                method = () =>
                  handleActionClick(
                    modalConstants.ACTION_MODAL_ENUM[
                      `FundAppeal${badgeContractAddr ? 'Badge' : ''}`
                    ],
                    badgeContractAddr ? { badgeContractAddr, side: SIDE } : SIDE
                  )
              } else if (Date.now() < endOfFirstHalf && payableValue) {
                label = 'Contribute Fees'
                disabled = false
                method = () =>
                  handleActionClick(
                    modalConstants.ACTION_MODAL_ENUM[
                      `FundAppeal${badgeContractAddr ? 'Badge' : ''}`
                    ],
                    badgeContractAddr ? { badgeContractAddr, side: SIDE } : SIDE
                  )
              }
            } else label = 'Waiting For Opponent'
          } else if (Date.now() > appealPeriodEnd) label = 'Waiting Enforcement'
        } else if (!payableValue) label = 'Waiting Enforcement'
        else if (Date.now() < appealPeriodEnd) label = 'Waiting Appeals'
      }
    } else if (
      submitterFees.gt(toBN(0)) &&
      challengerFees.gt(toBN(0)) > 0 &&
      latestRequest.parties[2] !== ZERO_ADDR
    ) {
      icon = 'gavel'
      disabled = false
      method = handleExecuteRequestClick
      label = submitterFees.gt(challengerFees)
        ? 'Timeout Challenger'
        : 'Timeout Submitter'
    } else if (
      Date.now() >=
      latestRequest.submissionTime + challengePeriodDuration
    ) {
      method = handleExecuteRequestClick
      icon = 'check'
      disabled = false
      label = 'Execute Request'
    } else if (
      latestRequest.parties[2] !== ZERO_ADDR &&
      (userAccount === latestRequest.parties[tcrConstants.SIDE.Requester] ||
        userAccount === latestRequest.parties[tcrConstants.SIDE.Challenger])
    ) {
      icon = 'gavel'
      label = 'Pay Arbitration Fees'
      disabled = false
      if (
        challengerFees.gt(submitterFees) &&
        userAccount === latestRequest.parties[tcrConstants.SIDE.Requester]
      )
        method = () =>
          handleActionClick(
            modalConstants.ACTION_MODAL_ENUM[
              `FundRequester${badgeContractAddr ? 'Badge' : ''}`
            ],
            { badgeContractAddr }
          )
      else if (
        submitterFees.gt(challengerFees) &&
        userAccount === latestRequest.parties[tcrConstants.SIDE.Challenger]
      )
        method = () =>
          handleActionClick(
            modalConstants.ACTION_MODAL_ENUM[
              `FundChallenger${badgeContractAddr ? 'Badge' : ''}`
            ],
            { badgeContractAddr }
          )
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
        handleActionClick(
          modalConstants.ACTION_MODAL_ENUM[
            `Challenge${badgeContractAddr ? 'Badge' : ''}`
          ],
          { badgeContractAddr }
        )
      if (isRegistrationRequest(item.status))
        label = badgeContractAddr
          ? 'Challenge Addition'
          : 'Challenge Registration'
      else label = badgeContractAddr ? 'Challenge Removal' : 'Challenge Removal'
    }
  else {
    disabled = false
    if (item.status === tcrConstants.IN_CONTRACT_STATUS_ENUM['Registered']) {
      method = () =>
        handleActionClick(
          modalConstants.ACTION_MODAL_ENUM[
            `Clear${badgeContractAddr ? 'Badge' : ''}`
          ],
          { badgeContractAddr }
        )
      label = badgeContractAddr ? 'Remove Badge' : 'Remove Token'
      icon = 'times-circle'
    } else {
      if (
        badgeContractAddr &&
        (badgeContractAddr === ETHFINEX_BADGE[1] ||
          badgeContractAddr === ETHFINEX_BADGE[42])
      ) {
        disabled = true
        hidden = true
      }
      label = badgeContractAddr ? 'Add Badge' : 'Resubmit Token'
      icon = 'plus'
      method = () =>
        handleActionClick(
          modalConstants.ACTION_MODAL_ENUM[
            `Resubmit${badgeContractAddr ? 'Badge' : ''}`
          ],
          { badgeContractAddr }
        )
    }
  }

  return (
    <Button
      disabled={onlyInfura || disabled}
      tooltip={onlyInfura ? 'Please install MetaMask.' : actionTooltip}
      onClick={method}
      style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
      type="primary"
      hidden={hidden}
    >
      <FontAwesomeIcon className="TokenDetails-icon" icon={icon} />
      {label}
    </Button>
  )
}

export default getActionButton
