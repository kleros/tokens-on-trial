import React from 'react'
import Img from 'react-image'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'
import { IPFS_URL } from '../../../bootstrap/dapp-api'
import UnknownToken from '../../../assets/images/unknown.svg'
import { _badgeShape } from '../../../reducers/badge'

const TokenInfo = ({ badge: { token }, FILE_BASE_URL }) =>
  token ? (
    <Link to={`/token/${token.ID}`} className="BadgeDetails-token">
      <Img
        className="BadgeDetails-header-img"
        src={`${
          token
            ? token.symbolMultihash[0] === '/'
              ? `${IPFS_URL}${token.symbolMultihash}`
              : `${FILE_BASE_URL}/${token.symbolMultihash}`
            : UnknownToken
        }`}
      />
      <h4 className="BadgeDetails-label-name">{token.name}</h4>
      <h4 className="BadgeDetails-label-ticker">{token.ticker}</h4>
    </Link>
  ) : (
    <div
      className="BadgeDetails-token"
      data-tip="There is no accepted token submission for this address on the T²CR"
    >
      <Img className="BadgeDetails-header-img" src={UnknownToken} />
      <h4 className="BadgeDetails-label-name">Unknown Token</h4>
    </div>
  )

TokenInfo.propTypes = {
  badge: _badgeShape.isRequired,
  FILE_BASE_URL: PropTypes.string.isRequired,
}

export default TokenInfo
