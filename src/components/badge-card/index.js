import React from 'react'
import Img from 'react-image'
import PropTypes from 'prop-types'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import { Link } from 'react-router-dom'

import EthfinexLogo from '../../assets/images/ethfinex.svg'
import * as tcrConstants from '../../constants/tcr'
import { ARBITRABLE_ADDRESS_LIST_ADDRESS } from '../../bootstrap/dapp-api'

import './badge-card.css'

const getBadgeHeaderColor = token => {
  if (token.badge.status === tcrConstants.IN_CONTRACT_STATUS_ENUM['Registered'])
    return '#009aff' // blue
  if (token.latestRequest.disputed && !token.latestRequest.resolved)
    return '#ff9900' // orange
  return '#ccc'
}

const getBadgeHeaderText = token => {
  if (token.badge.status === tcrConstants.IN_CONTRACT_STATUS_ENUM['Registered'])
    return 'Registered'
  if (token.latestRequest.disputed && !token.latestRequest.resolved)
    return 'Challenged'
  return 'Waiting'
}

const BadgeCard = ({ token }) => (
  <div className="BadgeCard">
    <div
      className="BadgeCard-header"
      style={{ backgroundColor: getBadgeHeaderColor(token) }}
    >
      <FontAwesomeIcon color="white" icon="check" />
      <h5 style={{ color: 'white' }}>{getBadgeHeaderText(token)}</h5>
      <FontAwesomeIcon
        color="white"
        icon="check"
        style={{ visibility: 'hidden' }}
      />{' '}
      {/* Used for spacing */}
    </div>
    <Link
      className="BadgeCard-content"
      to={`/token/${token.ID}/badge/${ARBITRABLE_ADDRESS_LIST_ADDRESS}`}
    >
      <Img
        alt="Badge List Submission"
        className="BadgeCard-image"
        src={EthfinexLogo}
      />
    </Link>
    <div className="BadgeCard-footer">
      <h5 className="BadgeCard-footer-text">
        Compliant with Ethfinex listing criterion
      </h5>
    </div>
  </div>
)

BadgeCard.propTypes = {
  token: PropTypes.shape({
    name: PropTypes.string.isRequired,
    symbolMultihash: PropTypes.string.isRequired,
    ticker: PropTypes.string.isRequired,
    addr: PropTypes.string.isRequired,
    status: PropTypes.oneOf(tcrConstants.IN_CONTRACT_STATUS_ENUM.indexes)
      .isRequired
  }).isRequired
}

export default BadgeCard
