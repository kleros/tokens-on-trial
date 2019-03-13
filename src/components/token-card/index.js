import React from 'react'
import Img from 'react-image'
import PropTypes from 'prop-types'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import { Link } from 'react-router-dom'

import * as tcrConstants from '../../constants/tcr'
import EtherScanLogo from '../../assets/images/etherscan.png'
import { getBadgeStyle } from '../../utils/ui'
import { FILE_BASE_URL } from '../../bootstrap/dapp-api'

import './token-card.css'

const TokenCard = ({ token, badge }) => (
  <div className="TokenCard">
    <div
      className="TokenCard-statusOverlay"
      style={{ color: tcrConstants.STATUS_COLOR_ENUM[token.clientStatus] }}
    >
      <FontAwesomeIcon
        className="TokenCard-statusOverlay-icon"
        color={tcrConstants.STATUS_COLOR_ENUM[token.clientStatus]}
        icon={tcrConstants.STATUS_ICON_ENUM[token.clientStatus]}
      />
      {tcrConstants.STATUS_ENUM[token.clientStatus]}
    </div>
    <div className="TokenCard-header">
      <FontAwesomeIcon
        color={tcrConstants.STATUS_COLOR_ENUM[token.clientStatus]}
        icon={tcrConstants.STATUS_ICON_ENUM[token.clientStatus]}
      />
      <h5>
        {`${token.name} ${token.name && token.ticker ? '-' : ''} ${
          token.ticker
        }`}
      </h5>
      <a
        href={`https://etherscan.io/token/${token.address}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <Img src={EtherScanLogo} />
      </a>
    </div>
    <Link className="TokenCard-content" to={`/token/${token.ID}`}>
      <Img
        alt="Token List Submission"
        className="TokenCard-image"
        src={`${
          token.symbolMultihash && token.symbolMultihash[0] === '/'
            ? `https://ipfs.kleros.io/`
            : `${FILE_BASE_URL}/`
        }${token.symbolMultihash}`}
      />
    </Link>
    <div
      className={`TokenCard-footer${
        token.status.status ===
          tcrConstants.IN_CONTRACT_STATUS_ENUM['Absent'] ||
        token.status.status ===
          tcrConstants.IN_CONTRACT_STATUS_ENUM['RegistrationRequested'] ||
        !badge ||
        badge.status.status === 0
          ? ' TokenCard-hidden'
          : ''
      }`}
    >
      {badge && badge.status.status !== 0 && (
        <span className="TokenCard-footer-badge" style={getBadgeStyle(badge)} />
      )}
    </div>
  </div>
)

TokenCard.propTypes = {
  token: PropTypes.shape({
    name: PropTypes.string.isRequired,
    symbolMultihash: PropTypes.string.isRequired,
    ticker: PropTypes.string.isRequired,
    address: PropTypes.string.isRequired,
    status: PropTypes.oneOf(tcrConstants.IN_CONTRACT_STATUS_ENUM.indexes)
      .isRequired
  }).isRequired,
  badge: PropTypes.shape({
    address: PropTypes.string.isRequired,
    status: PropTypes.shape({
      disputed: PropTypes.bool.isRequired,
      status: PropTypes.number.isRequired
    })
  })
}

TokenCard.defaultProps = {
  badge: null
}

export default TokenCard
