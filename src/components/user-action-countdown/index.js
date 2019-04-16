import React from 'react'
import PropTypes from 'prop-types'

import * as tcrConstants from '../../constants/tcr'
import { getItemInformation, getRemainingTime } from '../../utils/ui'
import { itemShape, tcrShape } from '../../reducers/generic-shapes'

import ActionCountdown from './action-countdown'

const UserActionCountdown = ({
  item,
  userAccount,
  tcrData,
  onAppealPeriodEnd,
  onLoserTimedOut,
  onChallengePeriodEnd
}) => {
  const { latestRequest } = item
  const { dispute, parties } = latestRequest
  const { userIsLoser, decisiveRuling, loserHasPaid } = getItemInformation(
    item,
    userAccount
  )

  const remainingTime = getRemainingTime(
    item,
    tcrData,
    tcrConstants,
    false,
    decisiveRuling
  )

  const remainingLoserTime = getRemainingTime(
    item,
    tcrData,
    tcrConstants,
    true,
    decisiveRuling
  )

  if (remainingTime <= 0 || (remainingLoserTime <= 0 && !loserHasPaid))
    return null

  /* eslint-disable react/jsx-no-bind */

  if (!dispute)
    return (
      <ActionCountdown
        icon="clock"
        text="Challenge Deadline"
        endTime={Date.now() + remainingTime}
        onComplete={() => onChallengePeriodEnd(true)}
      />
    )

  if (
    userAccount !== parties[tcrConstants.SIDE['Requester']] &&
    userAccount !== parties[tcrConstants.SIDE['Challenger']]
  )
    return (
      <>
        <ActionCountdown
          icon="clock"
          text="Winner Deadline"
          endTime={Date.now() + remainingTime}
          onComplete={() => onAppealPeriodEnd(true)}
        />
        <ActionCountdown
          icon="clock"
          text="Loser Deadline"
          endTime={Date.now() + remainingLoserTime}
          onComplete={() => onLoserTimedOut(true)}
        />
      </>
    )

  return (
    <ActionCountdown
      icon="clock"
      text="Appeal Deadline"
      endTime={Date.now() + (userIsLoser ? remainingLoserTime : remainingTime)}
      onComplete={
        userIsLoser
          ? () => onLoserTimedOut(true)
          : () => onAppealPeriodEnd(true)
      }
    />
  )
}

UserActionCountdown.propTypes = {
  item: itemShape.isRequired,
  userAccount: PropTypes.string.isRequired,
  tcrData: tcrShape.isRequired,
  onAppealPeriodEnd: PropTypes.func.isRequired,
  onLoserTimedOut: PropTypes.func.isRequired,
  onChallengePeriodEnd: PropTypes.func.isRequired
}

export default UserActionCountdown
