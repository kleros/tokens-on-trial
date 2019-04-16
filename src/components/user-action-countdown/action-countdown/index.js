import React from 'react'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import Countdown from 'react-countdown-now'
import PropTypes from 'prop-types'

import CountdownRenderer from '../../countdown-renderer'

import './action-countdown.css'

const ActionCountdown = ({ text, icon, endTime, onComplete }) => (
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
      <div>
        {text}{' '}
        <Countdown
          style={{ marginLeft: '6px' }}
          date={endTime}
          renderer={CountdownRenderer}
          onComplete={onComplete}
        />
      </div>
    </div>
  </span>
)

ActionCountdown.propTypes = {
  endTime: PropTypes.number.isRequired,
  onComplete: PropTypes.func.isRequired,
  text: PropTypes.string.isRequired,
  icon: PropTypes.string.isRequired
}

export default ActionCountdown
