import React from 'react'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import Progress from 'react-progressbar'
import PropTypes from 'prop-types'

import * as tcrConstants from '../../constants/tcr'
import { getItemInformation } from '../../utils/ui'

const CrowdfundingProgress = ({ item, userAccount, appealPeriodEnded }) => {
  const { status, latestRequest } = item
  const { dispute, latestRound, disputed, resolved } = latestRequest
  if (!disputed || (disputed && resolved)) return null

  const {
    loserTimedOut,
    requesterFeesPercent,
    challengerFeesPercent
  } = getItemInformation(item, userAccount)

  if (
    status <= 1 ||
    !dispute ||
    dispute.status !== tcrConstants.DISPUTE_STATUS.Appealable ||
    loserTimedOut ||
    appealPeriodEnded
  )
    return null

  const { appealed } = latestRound
  if (appealed) return null

  return (
    <div
      className="TokenDetails-meta TokenDetails-meta-crowdfunding"
      data-tip="If the party that lost the previous round is fully funded but the winner is not, the loser will win the dispute."
    >
      <span style={{ color: '#009aff', marginBottom: '7px' }}>
        <FontAwesomeIcon
          color="#009aff"
          icon="coins"
          style={{ marginRight: '14px' }}
        />
        <strong>Appeal Fee Crowdfunding:</strong>
      </span>
      <span>Requester</span>
      <Progress
        className="TokenDetails-meta-item TokenDetails-crowdfundingBar"
        completed={requesterFeesPercent}
        height="5px"
        color={requesterFeesPercent === 100 ? '#7ed9ff' : '#009aff'}
        style={{
          border: '1px solid #009aff',
          borderColor: requesterFeesPercent === 100 ? '#7ed9ff' : '#009aff',
          borderRadius: '3px',
          marginLeft: 0
        }}
      />
      <span>Challenger</span>
      <Progress
        className="TokenDetails-meta-item TokenDetails-crowdfundingBar"
        completed={challengerFeesPercent}
        height="5px"
        color={challengerFeesPercent === 100 ? '#7ed9ff' : '#009aff'}
        style={{
          border: '1px solid #009aff',
          borderColor: challengerFeesPercent === 100 ? '#7ed9ff' : '#009aff',
          borderRadius: '3px',
          marginLeft: 0
        }}
      />
    </div>
  )
}

CrowdfundingProgress.propTypes = {
  item: PropTypes.shape({
    status: PropTypes.number.isRequired,
    latestRequest: PropTypes.shape({
      dispute: PropTypes.shape({
        status: PropTypes.number.isRequired
      }),
      latestRound: PropTypes.shape({
        appealed: PropTypes.bool.isRequired
      }).isRequired
    }).isRequired
  }).isRequired,
  userAccount: PropTypes.string.isRequired,
  appealPeriodEnded: PropTypes.bool.isRequired
}

export default CrowdfundingProgress
