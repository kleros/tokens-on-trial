import React from 'react'
import Img from 'react-image'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'

import * as tcrConstants from '../../constants/tcr'
import EtherScanLogo from '../../assets/images/etherscan.png'
import {
  getItemStatusColor,
  getItemStatusText,
  getBadgeStyle
} from '../../utils/ui'
import { IPFS_URL } from '../../bootstrap/dapp-api'
import { envObjectsShape } from '../../reducers/generic-shapes'
import { badgesShape } from '../../reducers/badge'
import { _tokenShape } from '../../reducers/token'

import './token-card.css'

const TokenCard = ({ token, envObjects: { FILE_BASE_URL }, badges }) => (
  <div className="TokenCard">
    <div
      className="TokenCard-header"
      style={{ backgroundColor: getItemStatusColor(token) }}
    >
      <FontAwesomeIcon
        color="white"
        icon={tcrConstants.STATUS_ICON_ENUM[token.clientStatus]}
      />
      <h5 style={{ color: 'white' }}>{getItemStatusText(token)}</h5>
      <FontAwesomeIcon
        color="white"
        icon="check"
        style={{ visibility: 'hidden' }}
      />{' '}
    </div>
    <div>
      <Link
        style={{ padding: '15px' }}
        className="TokenCard-content"
        to={`/token/${token.ID}`}
      >
        <Img
          alt="Token List Submission"
          className="TokenCard-image"
          src={`${
            token.symbolMultihash && token.symbolMultihash[0] === '/'
              ? `${IPFS_URL}`
              : `${FILE_BASE_URL}/`
          }${token.symbolMultihash}`}
        />
        <h5 style={{ marginBottom: 0, marginTop: '12px', textAlign: 'center' }}>
          {`${token.name} ${token.name && token.ticker ? '-' : ''} ${
            token.ticker
          }`}
        </h5>
      </Link>
    </div>
    <div className="TokenCard-footer">
      <div style={{ display: 'flex' }}>
        {Object.keys(badges).map(badgeContrAddr => {
          const badge = badges[badgeContrAddr].items[token.address]
          return (
            badge &&
            badge.clientStatus !== 0 && (
              <span
                key={badgeContrAddr}
                className="TokenCard-footer-badge"
                style={getBadgeStyle(badge)}
              />
            )
          )
        })}
      </div>
      <span>
        <a
          href={`https://etherscan.io/token/${token.address}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ alignSelf: 'flex-end' }}
        >
          <Img src={EtherScanLogo} />
        </a>
      </span>
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
