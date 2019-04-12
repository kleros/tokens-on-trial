import React from 'react'
import PropTypes from 'prop-types'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import Countdown from 'react-countdown-now'

import * as tcrConstants from '../../constants/tcr'
import CountdownRenderer from '../countdown-renderer'
import { getItemInformation, getRemainingTime } from '../../utils/ui'
import { itemShape, tcrShape } from '../../reducers/generic-shapes'

const UserActionCountdown = ({
  item,
  userAccount,
  tcr,
  onAppealPeriodEnd,
  onLoserTimedout,
  onChallengePeriodEnd
}) => {
  const { latestRequest } = item
  const { dispute, parties } = latestRequest

  const { userIsLoser, decisiveRuling } = getItemInformation(item, userAccount)

  const remainingTime = getRemainingTime(
    item,
    tcr,
    tcrConstants,
    false,
    decisiveRuling
  )

  const remainingLoserTime = getRemainingTime(
    item,
    tcr,
    tcrConstants,
    true,
    decisiveRuling
  )

  if (remainingTime <= 0 || remainingLoserTime <= 0) return null
  if (!dispute)
    return (
      <span
        className="ItemStatus-meta-item"
        style={{
          display: 'flex',
          alignItems: 'center',
          color: '#f60c36'
        }}
      >
        <FontAwesomeIcon
          className="ItemStatus-icon"
          style={{ marginRight: '10px' }}
          color="#f60c36"
          icon="clock"
        />
        Challenge Deadline {/* eslint-disable react/jsx-no-bind */}
        <div style={{ marginLeft: '6px' }}>
          <Countdown
            date={Date.now() + remainingTime}
            renderer={CountdownRenderer}
            onComplete={() => onChallengePeriodEnd(true)}
          />
        </div>
      </span>
    )

  /* eslint-disable react/jsx-no-bind */

  if (
    userAccount !== parties[tcrConstants.SIDE['Requester']] &&
    userAccount !== parties[tcrConstants.SIDE['Challenger']]
  )
    return (
      <>
        <span
          className="ActionCountdown-meta-item"
          style={{
            display: 'flex',
            alignItems: 'center',
            color: '#f60c36'
          }}
        >
          <div className="ActionCountdown-timer">
            <FontAwesomeIcon
              className="ActionCountdown-icon"
              color="#f60c36"
              icon="clock"
            />
            <div>
              Winner Countdown{' '}
              <Countdown
                style={{ marginLeft: '6px' }}
                date={Date.now() + remainingTime}
                renderer={CountdownRenderer}
                onComplete={() => onAppealPeriodEnd(true)}
              />
            </div>
          </div>
        </span>
        <span
          className="ActionCountdown-meta-item"
          style={{
            display: 'flex',
            alignItems: 'center',
            color: '#f60c36'
          }}
        >
          <div className="ActionCountdown-timer">
            <FontAwesomeIcon
              className="ActionCountdown-icon"
              color="#f60c36"
              icon="clock"
            />
            <div>
              Loser Countdown{' '}
              <Countdown
                style={{ marginLeft: '6px' }}
                date={Date.now() + remainingLoserTime}
                renderer={CountdownRenderer}
                onComplete={() => onLoserTimedout(true)}
              />
            </div>
          </div>
        </span>
      </>
    )

  return (
    <span
      className="ActionCountdown-meta-item"
      style={{
        display: 'flex',
        alignItems: 'center',
        color: '#f60c36'
      }}
    >
      <div className="ActionCountdown-timer">
        <FontAwesomeIcon
          className="ActionCountdown-icon"
          color="#f60c36"
          icon="clock"
        />
        {/* eslint-disable react/jsx-no-bind */}
        <div>
          Appeal Deadline{' '}
          <Countdown
            style={{ marginLeft: '6px' }}
            date={
              Date.now() + (userIsLoser ? remainingLoserTime : remainingTime)
            }
            renderer={CountdownRenderer}
            onComplete={
              userIsLoser
                ? () => onLoserTimedout(true)
                : () => onAppealPeriodEnd(true)
            }
          />
        </div>
      </div>
    </span>
  )
}

UserActionCountdown.propTypes = {
  item: itemShape.isRequired,
  userAccount: PropTypes.string.isRequired,
  tcr: tcrShape.isRequired,
  onAppealPeriodEnd: PropTypes.func.isRequired,
  onLoserTimedout: PropTypes.func.isRequired,
  onChallengePeriodEnd: PropTypes.func.isRequired
}

export default UserActionCountdown
