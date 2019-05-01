import React from 'react'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import Progress from 'react-progressbar'
import PropTypes from 'prop-types'

import * as tcrConstants from '../../constants/tcr'
import {
  getItemInformation,
  getRemainingTime,
  truncateETHValue
} from '../../utils/ui'
import ItemActionButton from '../../containers/item-action-button'
import { itemShape, tcrShape } from '../../reducers/generic-shapes'

import './crowdfunding-card.css'

const CrowdfundingCard = ({ item, userAccount, tcrData, fundAppeal }) => {
  const { status, latestRequest } = item
  const { dispute, latestRound, disputed, resolved } = latestRequest
  if (!disputed || (disputed && resolved)) return null

  const {
    loserTimedOut,
    requesterFeesPercent,
    challengerFeesPercent,
    payableValue,
    decisiveRuling,
    winnerSide
  } = getItemInformation(item, userAccount)

  const remainingTime = getRemainingTime(
    item,
    tcrData,
    tcrConstants,
    false,
    decisiveRuling
  )

  const appealPeriodEnded = remainingTime <= 0

  if (
    status <= 1 ||
    !dispute ||
    dispute.status !== tcrConstants.DISPUTE_STATUS.Appealable ||
    loserTimedOut ||
    appealPeriodEnded ||
    !payableValue
  )
    return null

  const { appealed } = latestRound
  if (appealed) return null

  return (
    <div className="CrowdfundingCard">
      <div className="CrowdfundingCard-info">
        <h5 className="CrowdfundingCard-info-title">Appeal Crowdfunding</h5>
        <FontAwesomeIcon
          color="white"
          icon="coins"
          style={{ width: '24px', height: '24px' }}
        />
        <p className="CrowdfundingCard-info-paragraph">
          Earn rewards by contributing to the side that ultimately wins the
          dispute.
        </p>
      </div>
      <div className="CrowdfundingCard-status">
        <div className="CrowdfundingCard-status-parties">
          <div className="CrowdfundingCard-status-outcome">
            <FontAwesomeIcon
              color="white"
              icon="clock"
              style={{ width: '15px', height: '15px', margin: '0 8px' }}
            />
            <div>
              {decisiveRuling && (
                <p
                  style={{
                    color: 'white',
                    fontSize: '14px',
                    lineHeight: '14px'
                  }}
                >
                  Previous Round{' '}
                  {winnerSide === tcrConstants.SIDE.Requester
                    ? 'Winner'
                    : 'Looser'}
                </p>
              )}
              <p style={{ color: 'white' }}>
                <strong>Requester</strong>
              </p>
            </div>
          </div>
          <Progress
            completed={requesterFeesPercent}
            height="5px"
            color="#009aff"
            className="CrowdfundingCard-status-progressBar"
            style={{
              borderColor: challengerFeesPercent === 100 ? '#7ed9ff' : '#009aff'
            }}
          />
          <div>
            <p
              style={{
                color: 'white',
                textAlign: 'center',
                lineHeight: '12px'
              }}
            >
              <strong>
                {truncateETHValue(requesterFeesPercent, 3)}% Complete
              </strong>
            </p>
          </div>
        </div>
        <div className="CrowdfundingCard-status-divider" />
        <div className="CrowdfundingCard-status-parties">
          <div className="CrowdfundingCard-status-outcome">
            <FontAwesomeIcon
              color="white"
              icon="clock"
              style={{ width: '15px', height: '15px', margin: '0 8px' }}
            />
            <div>
              {decisiveRuling && (
                <p
                  style={{
                    color: 'white',
                    fontSize: '14px',
                    lineHeight: '14px'
                  }}
                >
                  Previous Round{' '}
                  {winnerSide === tcrConstants.SIDE.Challenger
                    ? 'Winner'
                    : 'Looser'}
                </p>
              )}
              <p style={{ color: 'white' }}>
                <strong>Challenger</strong>
              </p>
            </div>
          </div>
          <Progress
            className="CrowdfundingCard-status-progressBar"
            style={{
              borderColor: challengerFeesPercent === 100 ? '#7ed9ff' : '#009aff'
            }}
            completed={challengerFeesPercent}
            height="5px"
            color="#009aff"
          />
          <div>
            <p
              style={{
                color: 'white',
                textAlign: 'center',
                lineHeight: '12px'
              }}
            >
              <strong>
                {truncateETHValue(challengerFeesPercent, 3)}% Complete
              </strong>
            </p>
          </div>
        </div>
      </div>
      <div className="CrowdfundingCard-action">
        <FontAwesomeIcon
          color="white"
          icon="info-circle"
          style={{ width: '30px', height: '30px' }}
        />
        <p className="CrowdfundingCard-action-info">
          Contributions to the side that loses the case will be awarded to the
          backers of the winner.
        </p>
        <ItemActionButton
          item={item}
          userAccount={userAccount}
          tcr={tcrData}
          fundAppeal={fundAppeal}
          appealPeriodEnded={appealPeriodEnded}
          loserTimedOut={loserTimedOut}
        />
      </div>
    </div>
  )
}

CrowdfundingCard.propTypes = {
  item: itemShape.isRequired,
  userAccount: PropTypes.string.isRequired,
  tcrData: tcrShape.isRequired,

  fundAppeal: PropTypes.func.isRequired
}

export default CrowdfundingCard
