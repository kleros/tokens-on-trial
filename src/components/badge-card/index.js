import React from 'react'
import Img from 'react-image'
import PropTypes from 'prop-types'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import { Link } from 'react-router-dom'

import EthfinexLogo from '../../assets/images/ethfinex.svg'
import UnknownToken from '../../assets/images/unknown.svg'
import * as tcrConstants from '../../constants/tcr'
import {
  ARBITRABLE_ADDRESS_LIST_ADDRESS,
  FILE_BASE_URL
} from '../../bootstrap/dapp-api'

import './badge-card.css'

const getBadgeColor = token => {
  const { badge } = token
  if (badge.status === tcrConstants.IN_CONTRACT_STATUS_ENUM['Registered'])
    return '#009aff' // blue
  if (badge.status === tcrConstants.IN_CONTRACT_STATUS_ENUM['Absent'])
    return '#f60c36' // red
  if (badge.latestRequest.disputed && !badge.latestRequest.resolved)
    return '#ff9900' // orange
  return '#ccc'
}

const getBadgeHeaderText = token => {
  const { badge } = token
  if (badge.status === tcrConstants.IN_CONTRACT_STATUS_ENUM['Registered'])
    return 'Registered'
  if (badge.status === tcrConstants.IN_CONTRACT_STATUS_ENUM['Absent'])
    return 'Absent' // red
  if (badge.latestRequest.disputed && !badge.latestRequest.resolved)
    return 'Challenged'
  return 'Pending'
}

const BadgeCard = ({ token, displayTokenInfo }) => (
  <div className="BadgeCard">
    <div
      className="BadgeCard-header"
      style={{ backgroundColor: getBadgeColor(token) }}
    >
      <FontAwesomeIcon color="white" icon="check" />
      <h5 style={{ color: 'white' }}>{getBadgeHeaderText(token)}</h5>
      <FontAwesomeIcon
        color="white"
        icon="check"
        style={{ visibility: 'hidden' }}
      />{' '}
    </div>
    <Link
      className="BadgeCard-content"
      to={`/badge/${ARBITRABLE_ADDRESS_LIST_ADDRESS}/${token.addr}`}
    >
      {displayTokenInfo ? (
        <Img
          alt="Token List Submission"
          className="TokenCard-image"
          src={
            token.symbolMultihash
              ? token.symbolMultihash[0] === '/'
                ? `https://ipfs.kleros.io/${token.symbolMultihash}`
                : `${FILE_BASE_URL}/${token.symbolMultihash}`
              : UnknownToken
          }
        />
      ) : (
        <Img
          alt="Badge List Submission"
          className="BadgeCard-image"
          src={EthfinexLogo}
        />
      )}
    </Link>
    <div className="BadgeCard-footer">
      {displayTokenInfo ? (
        <h5 className="BadgeCard-footer-text">
          {`${token.ticker ? token.ticker : ''}
          ${token.name && token.ticker ? '-' : ''}
          ${token.name ? token.name : ''}
          ${!token.ticker && !token.name ? 'Unknown Token' : ''}
        `}
        </h5>
      ) : (
        <h5 className="BadgeCard-footer-text">
          Compliant with Ethfinex listing criterion
        </h5>
      )}
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
  }).isRequired,
  displayTokenInfo: PropTypes.bool
}

BadgeCard.defaultProps = {
  displayTokenInfo: false
}

export default BadgeCard
