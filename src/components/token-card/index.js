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

const TokenCard = ({ token }) => (
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
        href={`https://etherscan.io/token/${token.addr}`}
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
        token.status === tcrConstants.IN_CONTRACT_STATUS_ENUM['Absent'] ||
        token.status ===
          tcrConstants.IN_CONTRACT_STATUS_ENUM['RegistrationRequested'] ||
        !token.badge ||
        token.badge.status === tcrConstants.IN_CONTRACT_STATUS_ENUM['Absent']
          ? ' TokenCard-hidden'
          : ''
      }`}
    >
      {token.badge && (
        <span
          className="TokenCard-footer-badge"
          style={getBadgeStyle(token.badge, tcrConstants)}
        />
      )}
    </div>
  </div>
)

TokenCard.propTypes = {
  token: PropTypes.shape({
    name: PropTypes.string.isRequired,
    symbolMultihash: PropTypes.string.isRequired,
    ticker: PropTypes.string.isRequired,
    addr: PropTypes.string.isRequired,
    status: PropTypes.oneOf(tcrConstants.IN_CONTRACT_STATUS_ENUM.indexes)
      .isRequired
  }).isRequired
}

export default TokenCard
