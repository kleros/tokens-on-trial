import React from 'react'
import Img from 'react-image'
import PropTypes from 'prop-types'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'
import { BeatLoader } from 'react-spinners'

import UnknownToken from '../../assets/images/unknown.svg'
import { IPFS_URL, web3Utils } from '../../bootstrap/dapp-api'
import { cacheItemShape } from '../../reducers/generic-shapes'
import { _arbitrableAddressListDataShape } from '../../reducers/arbitrable-address-list'
import { getItemStatusColor, getItemStatusText } from '../../utils/ui'
import * as tokenSelectors from '../../reducers/token'
import * as tcrConstants from '../../constants/tcr'

import './badge-card.css'

const BadgeCard = ({
  badge,
  tokens,
  envObjects,
  arbitrableAddressListData
}) => {
  // Link to the oldest, registered token submission for this address.
  if (!badge) return <BeatLoader color="#3d464d" />

  const badgeContractData = arbitrableAddressListData[badge.badgeContractAddr]
  const {
    variables: { symbolURI, title }
  } = badgeContractData
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
  const token = tokenSubmissions[0]
  const { FILE_BASE_URL } = envObjects

  return (
    <div className="BadgeCard">
      <div
        className="BadgeCard-header"
        style={{ backgroundColor: getItemStatusColor(badge) }}
      >
        <FontAwesomeIcon
          color="white"
          icon={tcrConstants.STATUS_ICON_ENUM[badge.clientStatus]}
        />
        <h5 style={{ color: 'white' }}>{getItemStatusText(badge)}</h5>
        {/* Hidden icon used for spacing only. */}
        <FontAwesomeIcon
          color="white"
          icon="check"
          style={{ visibility: 'hidden' }}
        />{' '}
      </div>
      <div>
        <Link
          className="BadgeCard-content"
          to={`/badge/${web3Utils.toChecksumAddress(badge.badgeContractAddr)}/${
            badge.address
          }`}
          style={{ padding: '15px' }}
        >
          <Img
            alt="Badge List Submission"
            className="BadgeCard-image"
            src={`${IPFS_URL}${symbolURI}`}
          />
          <div className="BadgeCard-content-title">
            <h5
              style={{
                margin: 0,
                textAlign: 'center',
                maxWidth: '200px'
              }}
            >
              {title} Compliant
            </h5>
          </div>
        </Link>
      </div>
      <Link
        to={token ? `/token/${token.ID}` : ''}
        style={{ pointerEvents: token ? '' : 'none', textDecoration: 'none' }}
      >
        <div className="BadgeCard-footer">
          <Img
            src={
              token
                ? token.symbolMultihash[0] === '/'
                  ? `${IPFS_URL}${token.symbolMultihash}`
                  : `${FILE_BASE_URL}/${token.symbolMultihash}`
                : UnknownToken
            }
            style={{ width: '25px', height: '25px', objectFit: 'contain' }}
          />
          <h5 className="BadgeCard-footer-text">
            {token ? `${token.name} - ${token.ticker}` : 'Unknown Token'}
          </h5>
          <Img /* Used for spacing only. */
            src={UnknownToken}
            style={{ visibility: 'hidden', width: '17px' }}
          />
        </div>
      </Link>
    </div>
  )
}

BadgeCard.propTypes = {
  tokens: tokenSelectors.tokensShape.isRequired,
  badge: cacheItemShape.isRequired,
  envObjects: PropTypes.shape({}).isRequired,
  arbitrableAddressListData: PropTypes.objectOf(_arbitrableAddressListDataShape)
    .isRequired
}

export default connect(state => ({
  tokens: state.tokens,
  badges: state.badges,
  envObjects: state.envObjects.data
}))(BadgeCard)
