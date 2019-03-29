import React from 'react'
import Img from 'react-image'
import PropTypes from 'prop-types'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'

import * as tcrConstants from '../../constants/tcr'
import EtherScanLogo from '../../assets/images/etherscan.png'
import { getBadgeStyle, userFriendlyLabel } from '../../utils/ui'
import { IPFS_URL } from '../../bootstrap/dapp-api'

import './token-card.css'

const TokenCard = ({ token, badge, fileBaseURL, envObjects }) => {
  const { FILE_BASE_URL } = envObjects
  return (
    <div className="TokenCard">
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
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <div
            className="TokenCard-content-statusOverlay"
            style={{
              color: tcrConstants.STATUS_COLOR_ENUM[token.clientStatus]
            }}
          >
            <FontAwesomeIcon
              className="TokenCard-content-statusOverlay-icon"
              color={tcrConstants.STATUS_COLOR_ENUM[token.clientStatus]}
              icon={tcrConstants.STATUS_ICON_ENUM[token.clientStatus]}
            />
            {userFriendlyLabel[tcrConstants.STATUS_ENUM[token.clientStatus]]}
          </div>
          <img
            alt="Token Submission"
            className="TokenCard-image"
            src={`${
              token.symbolMultihash && token.symbolMultihash[0] === '/'
                ? `${IPFS_URL}`
                : `${FILE_BASE_URL}/`
            }${token.symbolMultihash}`}
          />
        </div>
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
          <span
            className="TokenCard-footer-badge"
            style={getBadgeStyle(badge)}
          />
        )}
      </div>
    </div>
  )
}

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

export default connect(state => ({
  envObjects: state.envObjects.data
}))(TokenCard)
