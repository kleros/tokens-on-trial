import React from 'react'
import Img from 'react-image'
import PropTypes from 'prop-types'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'

import './token-card.css'
import EtherScanLogo from '../../../src/assets/images/etherscan.png'

const TokenCard = ({ name, imageUrl, ticker, badges }) => (
  <div className="TokenCard">
    <div className="TokenCard-header">
      <FontAwesomeIcon icon="check" color="#11BABD" />
      <h5>
        {name} - {ticker}
      </h5>
      <a href="/">
        <Img src={EtherScanLogo} />
      </a>
    </div>
    <div className="TokenCard-content">
      <Img
        src={imageUrl}
        alt={`Doge List Submission`}
        className="TokenCard-image"
      />
    </div>
    {badges && <div className="TokenCard-footer" />}
  </div>
)

TokenCard.propTypes = {
  name: PropTypes.string.isRequired,
  imageUrl: PropTypes.string.isRequired,
  ticker: PropTypes.string.isRequired,
  badges: PropTypes.shape([]).isRequired
}

export default TokenCard
