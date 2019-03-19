import React from 'react'
import Img from 'react-image'
import PropTypes from 'prop-types'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'
import { BeatLoader } from 'react-spinners'

import EthfinexLogo from '../../assets/images/ethfinex.svg'
import UnknownToken from '../../assets/images/unknown.svg'
import * as tcrConstants from '../../constants/tcr'
import {
  ARBITRABLE_ADDRESS_LIST_ADDRESS,
  FILE_BASE_URL,
  IPFS_URL
} from '../../bootstrap/dapp-api'

import './badge-card.css'

const getBadgeColor = badge => {
  if (badge.clientStatus === 0) return '#f60c36' // red
  if (badge.clientStatus === 1) return '#009aff' // blue
  if (badge.clientStatus > 3) return '#ff9900' // orange
  return '#ccc'
}

const getBadgeHeaderText = badge => {
  if (badge.clientStatus === 0) return 'Absent' // red
  if (badge.clientStatus === 1) return 'Registered'
  if (badge.clientStatus > 3) return 'Challenged'
  return 'Pending'
}

const BadgeCard = ({ badge, tokens, displayTokenInfo }) => {
  // Link to the oldest, registered token submission for this address.
  const tokenData = tokens.data
  let tokenSubmissions = []
  if (tokenData.addressToIDs[badge.address]) {
    tokenData.addressToIDs[badge.address].forEach(tokenID => {
      if (
        tokenData.items[tokenID].status.status === 1 ||
        tokenData.items[tokenID].status.status === 3
      )
        tokenSubmissions.push(tokenData.items[tokenID])
    })

    tokenSubmissions = tokenSubmissions.sort((a, b) =>
      a.statusBlockNumber < b.statusBlockNumber ? -1 : 1
    )
  }
  const token = displayTokenInfo ? tokenSubmissions[0] : null

  return (
    <div className="BadgeCard">
      <div
        className="BadgeCard-header"
        style={{ backgroundColor: getBadgeColor(badge) }}
      >
        <FontAwesomeIcon color="white" icon="check" />
        <h5 style={{ color: 'white' }}>{getBadgeHeaderText(badge)}</h5>
        <FontAwesomeIcon
          color="white"
          icon="check"
          style={{ visibility: 'hidden' }}
        />{' '}
      </div>
      <Link
        className="BadgeCard-content"
        to={`/badge/${ARBITRABLE_ADDRESS_LIST_ADDRESS}/${badge.address}`}
      >
        {displayTokenInfo ? (
          !tokens.loading || token ? (
            <Img
              alt="Token List Submission"
              className="TokenCard-image"
              src={
                token
                  ? token.symbolMultihash[0] === '/'
                    ? `${IPFS_URL}${token.symbolMultihash}`
                    : `${FILE_BASE_URL}/${token.symbolMultihash}`
                  : UnknownToken
              }
            />
          ) : (
            <BeatLoader color="#3d464d" />
          )
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
            {(!tokens.loading || token) && `Ethfinex Compliant`}
            <br />
            {!tokens.loading || token
              ? token
                ? `${token.ticker ? token.ticker : ''}
                ${token.name && token.ticker ? '-' : ''}
                ${token.name ? token.name : ''}`
                : `Unknown Token`
              : 'Loading...'}
          </h5>
        ) : (
          <h5 className="BadgeCard-footer-text">
            Compliant with Ethfinex listing criterion
          </h5>
        )}
      </div>
    </div>
  )
}

BadgeCard.propTypes = {
  token: PropTypes.shape({
    name: PropTypes.string.isRequired,
    symbolMultihash: PropTypes.string.isRequired,
    ticker: PropTypes.string.isRequired,
    addr: PropTypes.string.isRequired,
    status: PropTypes.oneOf(tcrConstants.IN_CONTRACT_STATUS_ENUM.indexes)
      .isRequired
  }).isRequired,
  tokens: PropTypes.shape({}).isRequired,
  badge: PropTypes.shape({}).isRequired,
  displayTokenInfo: PropTypes.bool
}

BadgeCard.defaultProps = {
  displayTokenInfo: false
}

export default connect(state => ({
  tokens: state.tokens,
  badges: state.badges
}))(BadgeCard)
