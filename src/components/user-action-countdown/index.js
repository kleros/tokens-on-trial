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
  onLoserTimedOut
}) => {
  const { latestRequest } = item
  const { dispute, parties } = latestRequest
  const {
    userIsLoser,
    decisiveRuling,
    loserHasPaid,
    payableValue
  } = getItemInformation(item, userAccount)

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

  if (remainingTime <= 0) return null

  /* eslint-disable react/jsx-no-bind */

  if (!dispute)
    return (
      <ActionCountdown
        icon="clock"
        text="Challenge Deadline"
        endTime={Date.now() + remainingTime}
      />
    )

  if (!payableValue) return null

  if (
    userAccount !== parties[tcrConstants.SIDE['Requester']] &&
    userAccount !== parties[tcrConstants.SIDE['Challenger']] &&
    decisiveRuling
  )
    return (
      <>
        <ActionCountdown
          icon="clock"
          text={`${
            remainingLoserTime <= 0 && !loserHasPaid
              ? 'Enforcement Countdown'
              : 'Winner Deadline'
          }`}
          endTime={Date.now() + remainingTime}
          onComplete={() => onAppealPeriodEnd(true)}
        />
        {remainingLoserTime > 0 && (
          <ActionCountdown
            icon="clock"
            text="Loser Deadline"
            endTime={Date.now() + remainingLoserTime}
            onComplete={() => onLoserTimedOut(true)}
          />
        )}
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
  onLoserTimedOut: PropTypes.func.isRequired
}

export default UserActionCountdown
