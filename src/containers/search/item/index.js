import React from 'react'
import PropTypes from 'prop-types'
import Img from 'react-image'
import { connect } from 'react-redux'

import { truncateMiddle, getItemStatusColor } from '../../../utils/ui'
import { web3Utils, IPFS_URL } from '../../../bootstrap/dapp-api'

import './item.css'

const SearchItem = ({ onClick, item, FILE_BASE_URL }) => (
  <li
    onClick={onClick}
    className="SearchItem"
    style={{ borderLeft: `2px solid ${getItemStatusColor(item)}` }}
  >
    <Img
      className="SearchItem-symbol"
      alt="submission-symbol"
      src={
        item.symbolMultihash && item.symbolMultihash[0] === '/'
          ? `${IPFS_URL}${item.symbolMultihash}`
          : `${FILE_BASE_URL}/${item.symbolMultihash}`
      }
    />
    <div className="SearchItem-text">
      <span className="SearchItem-text-title">
        {item.name} ({item.ticker})
      </span>
      <span className="SearchItem-text-address">
        {truncateMiddle(web3Utils.toChecksumAddress(item.address))}
      </span>
    </div>
  </li>
)

SearchItem.propTypes = {
  onClick: PropTypes.func.isRequired,
  item: PropTypes.shape({
    name: PropTypes.string.isRequired,
    ticker: PropTypes.string.isRequired,
    address: PropTypes.string.isRequired,
    imgSrc: PropTypes.string.isRequired
  }).isRequired,
  FILE_BASE_URL: PropTypes.string.isRequired
}

export default connect(state => ({
  envObjects: state.envObjects.data
}))(SearchItem)
