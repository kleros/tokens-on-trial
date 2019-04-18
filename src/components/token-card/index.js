import React from 'react'
import Img from 'react-image'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'

import * as tcrConstants from '../../constants/tcr'
import EtherScanLogo from '../../assets/images/etherscan.png'
import { getBadgeStyle, userFriendlyLabel } from '../../utils/ui'
import { IPFS_URL } from '../../bootstrap/dapp-api'
import { envObjectsShape } from '../../reducers/generic-shapes'
import { badgesShape } from '../../reducers/badge'
import { _tokenShape } from '../../reducers/token'

import './token-card.css'

const TokenCard = ({ token, envObjects: { FILE_BASE_URL }, badges }) => (
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
    <div className="TokenCard-footer">
      {Object.keys(badges).map(badgeContrAddr => {
        const badge = badges[badgeContrAddr].items[token.address]
        return (
          badge &&
          badge.status.clientStatus !== 0 && (
            <span
              key={badgeContrAddr}
              className="TokenCard-footer-badge"
              style={getBadgeStyle(badge)}
            />
          )
        )
      })}
    </div>
  </div>
)

TokenCard.propTypes = {
  token: _tokenShape.isRequired,
  badges: badgesShape.isRequired,
  envObjects: envObjectsShape.isRequired
}

export default connect(state => ({
  envObjects: state.envObjects.data,
  badges: state.badges.data
}))(TokenCard)
