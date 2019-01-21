import React from 'react'
import Img from 'react-image'
import PropTypes from 'prop-types'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import { Link } from 'react-router-dom'

import './badge-card.css'
import EtherScanLogo from '../../../src/assets/images/etherscan.png'
import EthfinexLogo from '../../../src/assets/images/ethfinex.svg'
import * as tokenConstants from '../../constants/token'

const BadgeCard = ({ token }) => (
  <div className="BadgeCard">
    <div className="BadgeCard-header">
      <FontAwesomeIcon color="white" icon="check" />
      <h5 style={{ color: 'white' }}>Registered</h5>
      <a
        href={`https://etherscan.io/token/${token.addr}`}
        style={{ visibility: 'hidden' }}
      >
        <Img src={EtherScanLogo} />
      </a>
    </div>
    <Link className="BadgeCard-content" to={`/token/${token.ID}`}>
      <Img
        alt="Badge List Submission"
        className="BadgeCard-image"
        src={EthfinexLogo}
      />
    </Link>
    <div className="BadgeCard-footer">
      <h5 className="BadgeCard-footer-text">
        Compliant with Ethfinex listing criterion
      </h5>
    </div>
  </div>
)

BadgeCard.propTypes = {
  token: PropTypes.shape({
    name: PropTypes.string.isRequired,
    symbolMultihash: PropTypes.string.isRequired,
    ticker: PropTypes.string.isRequired,
    addr: PropTypes.string.isRequired,
    status: PropTypes.oneOf(tokenConstants.IN_CONTRACT_STATUS_ENUM.indexes)
      .isRequired
  }).isRequired
}

export default BadgeCard
