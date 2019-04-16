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
import { arbitrableAddressListDataShape } from '../../reducers/arbitrable-address-list'
import * as tokenSelectors from '../../reducers/token'

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

const BadgeCard = ({
  badge,
  tokens,
  displayTokenInfo,
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
  const token = displayTokenInfo ? tokenSubmissions[0] : null
  const { FILE_BASE_URL } = envObjects

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
        to={`/badge/${web3Utils.toChecksumAddress(badge.badgeContractAddr)}/${
          badge.address
        }`}
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
            src={`${IPFS_URL}${symbolURI}`}
          />
        )}
      </Link>
      <div className="BadgeCard-footer">
        {displayTokenInfo ? (
          <h5 className="BadgeCard-footer-text">
            {(!tokens.loading || token) && `${title} Compliant`}
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
          <h5 className="BadgeCard-footer-text">Compliant with {title}</h5>
        )}
      </div>
    </div>
  )
}

BadgeCard.propTypes = {
  tokens: tokenSelectors.tokensShape.isRequired,
  badge: cacheItemShape.isRequired,
  envObjects: PropTypes.shape({}).isRequired,
  displayTokenInfo: PropTypes.bool,
  arbitrableAddressListData: arbitrableAddressListDataShape.isRequired
}

BadgeCard.defaultProps = {
  displayTokenInfo: false
}

export default connect(state => ({
  tokens: state.tokens,
  badges: state.badges,
  envObjects: state.envObjects.data
}))(BadgeCard)
