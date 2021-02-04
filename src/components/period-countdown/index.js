import React, { useState } from 'react'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import Countdown from 'react-countdown-now'
import * as tcrConstants from '../../constants/tcr'
import CountdownRenderer from '../countdown-renderer'
import { itemShape } from '../../reducers/generic-shapes'
import './period-countdown.css'

const PeriodCountdown = ({ item: { latestRequest, clientStatus } }) => {
  const { dispute, disputed } = latestRequest || {}
  if (clientStatus <= 1 || !disputed) return null

  let periodRemainingTime = 0
  const { court, lastPeriodChange, period } = dispute || {}
  const timesPerPeriod = court.timesPerPeriod

  periodRemainingTime =
    period === tcrConstants.COURT_PERIOD['Commit']
      ? lastPeriodChange + timesPerPeriod[1] + timesPerPeriod[2] - Date.now()
      : lastPeriodChange + timesPerPeriod[period] - Date.now()
  const [periodEnded, setPeriodEnded] = useState(periodRemainingTime <= 0)

  if (clientStatus <= 1 || !disputed) return null

  const message = tcrConstants.COURT_PERIOD_STRINGS[period]
  if (period === tcrConstants.COURT_PERIOD['Appeal']) return null // There is a dedicated countdown for user action periods.
  if (period === tcrConstants.COURT_PERIOD['Execution']) return null // Hide timer during execution period.

  return (
    <span
      className="PeriodCountdown-meta-item"
      style={{
        display: 'flex',
        alignItems: 'center',
        color: '#f60c36',
      }}
    >
      <div className="PeriodCountdown-timer">
        <FontAwesomeIcon
          className="PeriodCountdown-icon"
          color="#f60c36"
          icon="clock"
        />
        {/* eslint-disable react/jsx-no-bind */}
        {periodEnded && disputed ? (
          'Waiting Next Period'
        ) : (
          <>
            <span style={{ marginRight: '6px' }}>{message}</span>
            <Countdown
              date={Date.now() + periodRemainingTime}
              renderer={CountdownRenderer}
              onComplete={() => setPeriodEnded(true)}
            />
          </>
        )}
      </div>
    </span>
  )
}

PeriodCountdown.propTypes = {
  item: itemShape.isRequired,
}

export default PeriodCountdown
