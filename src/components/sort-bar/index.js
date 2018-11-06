import React from 'react'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'

import './sort-bar.css'

const SortBar = () => (
  <div className="SortBar">
    <div className="SortBar-count">123.456 Tokens</div>
    <div className="SortBar-sort">
      <div className="SortBar-sort-label">Sort by period:</div>
      <div className="SortBar-sort-choice">All</div>
      <FontAwesomeIcon
        className="SortBar-sort-margin"
        icon="caret-down"
        size="xs"
      />
      <div className="SortBar-sort-choice">Newest</div>
      <FontAwesomeIcon icon="caret-down" size="xs" />
    </div>
  </div>
)

export default SortBar
