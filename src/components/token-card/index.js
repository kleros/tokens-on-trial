import React from 'react'
import Img from 'react-image'
import PropTypes from 'prop-types'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'

import './token-card.css'
import EtherScanLogo from '../../../src/assets/images/etherscan.png'

const TokenCard = ({ token }) => (
  <div className="TokenCard">
    <div className="TokenCard-header">
      <FontAwesomeIcon icon="check" color="#11BABD" />
      <h5>
        {token.name} - {token.ticker}
      </h5>
      <a href={`https://etherscan.io/token/${token.address}`}>
        <Img src={EtherScanLogo} />
      </a>
    </div>
    <div className="TokenCard-content">
      <Img
        src={token.imageUrl}
        alt={`Doge List Submission`}
        className="TokenCard-image"
      />
    </div>
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
    imageUrl: PropTypes.string.isRequired,
    ticker: PropTypes.string.isRequired,
    address: PropTypes.string.isRequired,
    badges: PropTypes.arrayOf(PropTypes.shape({})).isRequired
  }).isRequired
}

export default TokenCard
