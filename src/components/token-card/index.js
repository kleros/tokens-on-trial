import React from 'react'
import Img from 'react-image'
import PropTypes from 'prop-types'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import { Link } from 'react-router-dom'

import './token-card.css'
import EtherScanLogo from '../../../src/assets/images/etherscan.png'
import * as tokenConstants from '../../constants/token'

const TokenCard = ({ token }) => (
  <div className="TokenCard">
    <div className="TokenCard-header">
      <FontAwesomeIcon
        className={
          token.clientStatus === tokenConstants.STATUS_ENUM.PENDING
            ? 'TokenCard-hidden'
            : ''
        }
        icon={tokenConstants.STATUS_ICON_ENUM[token.clientStatus]}
        color={tokenConstants.STATUS_COLOR_ENUM[token.clientStatus]}
      />
      <h5>
        {token.name} - {token.ticker}
      </h5>
      <a href={`https://etherscan.io/token/${token.address}`}>
        <Img src={EtherScanLogo} />
      </a>
    </div>
    <Link className="TokenCard-content" to={`${token.ID}`}>
      <Img
        src={token.URL}
        alt={`Token List Submission`}
        className="TokenCard-image"
      />
    </Link>
    <div
      className={`TokenCard-footer${
        !token.badges || token.badges.length === 0 ? ' TokenCard-hidden' : ''
      }`}
    />
  </div>
)

TokenCard.propTypes = {
  token: PropTypes.shape({
    name: PropTypes.string.isRequired,
    URL: PropTypes.string.isRequired,
    ticker: PropTypes.string.isRequired,
    address: PropTypes.string.isRequired,
    badges: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
    status: PropTypes.oneOf(tokenConstants.IN_CONTRACT_STATUS_ENUM.indexes)
      .isRequired
  }).isRequired
}

export default TokenCard
