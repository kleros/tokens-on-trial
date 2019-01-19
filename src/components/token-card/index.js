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
        color={tokenConstants.STATUS_COLOR_ENUM[token.clientStatus]}
        icon={tokenConstants.STATUS_ICON_ENUM[token.clientStatus]}
      />
      <h5>
        {token.name} - {token.ticker}
      </h5>
      <a href={`https://etherscan.io/token/${token.addr}`}>
        <Img src={EtherScanLogo} />
      </a>
    </div>
    <Link className="TokenCard-content" to={`/token/${token.ID}`}>
      <Img
        alt="Token List Submission"
        className="TokenCard-image"
        src={`https://staging-cfs.s3.us-east-2.amazonaws.com/${
          token.symbolMultihash
        }`}
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
    symbolMultihash: PropTypes.string.isRequired,
    ticker: PropTypes.string.isRequired,
    addr: PropTypes.string.isRequired,
    status: PropTypes.oneOf(tokenConstants.IN_CONTRACT_STATUS_ENUM.indexes)
      .isRequired
  }).isRequired
}

export default TokenCard
