import React from 'react'
import PropTypes from 'prop-types'
import Img from 'react-image'

import { truncateMiddle } from '../../../utils/ui'
import { web3, FILE_BASE_URL } from '../../../bootstrap/dapp-api'

import './item.css'

const SearchItem = ({ onClick, item }) => (
  <li onClick={onClick} className="SearchItem">
    <Img
      className="SearchItem-symbol"
      alt="submission-symbol"
      src={
        item.symbolMultihash && item.symbolMultihash[0] === '/'
          ? `https://ipfs.kleros.io${item.symbolMultihash}`
          : `${FILE_BASE_URL}/${item.symbolMultihash}`
      }
    />
    <div className="SearchItem-text">
      <span className="SearchItem-text-title">
        {item.name} ({item.ticker})
      </span>
      <span className="SearchItem-text-address">
        {truncateMiddle(web3.utils.toChecksumAddress(item.address))}
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
  }).isRequired
}

export default SearchItem
