import React, { useState } from 'react'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import Countdown from 'react-countdown-now'
import PropTypes from 'prop-types'

import CountdownRenderer from '../../countdown-renderer'
import { getRemainingTime, getItemInformation } from '../../../utils/ui'
import { itemShape, tcrShape } from '../../../reducers/generic-shapes'
import * as tcrConstants from '../../../constants/tcr'

import './action-countdown.css'

const ActionCountdown = ({ item, userAccount, tcrData, text, icon }) => {
  const [countdownCompleted, setCountdownCompleted] = useState(false)
  if (countdownCompleted) return null

  const { userIsLoser, decisiveRuling } = getItemInformation(item, userAccount)

  const remainingTime = getRemainingTime(
    item,
    tcrData,
    tcrConstants,
    userIsLoser,
    decisiveRuling
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
          icon={icon}
        />
        {/* eslint-disable react/jsx-no-bind */}
        <div>
          {text}
          <Countdown
            style={{ marginLeft: '6px' }}
            date={Date.now() + remainingTime}
            renderer={CountdownRenderer}
            onComplete={() => setCountdownCompleted(true)}
          />
        </div>
      </div>
    </span>
  )
}

ActionCountdown.propTypes = {
  item: itemShape.isRequired,
  userAccount: PropTypes.string.isRequired,
  tcrData: tcrShape.isRequired,
  text: PropTypes.string.isRequired,
  icon: PropTypes.string.isRequired
}

export default ActionCountdown
