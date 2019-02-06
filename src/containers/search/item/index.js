import React from 'react'
import PropTypes from 'prop-types'

import './item.css'

const SearchItem = ({ onClick, children }) => (
  <li onClick={onClick} className="SearchItem">
    {children}
  </li>
)

SearchItem.propTypes = {
  onClick: PropTypes.func.isRequired,
  children: PropTypes.shape({}).isRequired
}

export default SearchItem
