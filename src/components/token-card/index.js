import React from 'react'
import Img from 'react-image'
import PropTypes from 'prop-types'

import './token-card.css'

const TokenCard = ({ name, imageUrl, ticker }) => (
  <div className="TokenCard">
    <div className="TokenCard-header">
      <h5>
        {name} - {ticker}
      </h5>
    </div>
    <div className="TokenCard-content">
      <Img
        src={imageUrl}
        alt={`Doge List Submission`}
        className="TokenCard-image"
      />
    </div>
    <div className="TokenCard-footer" />
  </div>
)

TokenCard.propTypes = {
  name: PropTypes.string.isRequired,
  imageUrl: PropTypes.string.isRequired,
  ticker: PropTypes.string.isRequired
}

export default TokenCard
