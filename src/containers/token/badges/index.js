import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import * as tcrConstants from '../../../constants/tcr'
import { onlyInfura } from '../../../bootstrap/dapp-api'
import Button from '../../../components/button'
import BadgeCard from '../../../components/badge-card'
import { itemShape, cacheItemShape } from '../../../reducers/generic-shapes'

import './badges.css'

const BadgesSection = ({
  token: { status, address },
  submitBadgeAction,
  badges
}) => {
  const displayedBadges = Object.keys(badges)
    .map(badgeContractAddr => badges[badgeContractAddr])
    .filter(badgeContractData => badgeContractData.items[address])
    .map(badgeContractData => badgeContractData.items[address])
    .filter(badge => badge.clientStatus !== tcrConstants.STATUS_ENUM['Absent'])

  return (
    <div className="TokenDescription">
      <hr className="Badges-separator" />
      <div className="Badges-badge-header">
        <h3 style={{ marginTop: 0 }}>Badges</h3>
        {(status === tcrConstants.IN_CONTRACT_STATUS_ENUM['Registered'] ||
          status ===
            tcrConstants.IN_CONTRACT_STATUS_ENUM['ClearingRequested']) && (
          <Button
            tooltip={onlyInfura ? 'Please install MetaMask.' : null}
            disabled={onlyInfura}
            onClick={submitBadgeAction}
            type="secondary"
            style={{ width: '117px' }}
          >
            Add Badge
          </Button>
        )}
        {status !== tcrConstants.IN_CONTRACT_STATUS_ENUM['Registered'] &&
          status !==
            tcrConstants.IN_CONTRACT_STATUS_ENUM['ClearingRequested'] && (
            <span className="Badges-info">
              Tokens must be registered to receive badges.
            </span>
          )}
      </div>
      {status !== tcrConstants.STATUS_ENUM['Absent'] && ( // Don't show badges if token is absent.
        <div className="Badges-cards">
          {displayedBadges.map(badge => (
            <BadgeCard
              badge={badge}
              key={`${badge.badgeContractAddr}.${address}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

BadgesSection.propTypes = {
  token: itemShape.isRequired,
  submitBadgeAction: PropTypes.func.isRequired,
  badges: PropTypes.objectOf(cacheItemShape.isRequired).isRequired
}

export default connect(state => ({
  badges: state.badges.data
}))(BadgesSection)
