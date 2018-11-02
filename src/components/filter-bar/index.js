import React from 'react'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'

import './filter-bar.css'

const FilterBar = () => (
  <div>
    <div className="FilterBar">
      <div className="FilterBar-search">
        <FontAwesomeIcon icon="search" />
        <div className="FilterBar-search-label">Search</div>
      </div>
      <div className="FilterBar-filter">
        <div className="FilterBar-filter-label">Filter:</div>
        <div className="FilterBar-filter-choice">Registered</div>
        <FontAwesomeIcon icon="filter" size="xs" />
      </div>
    </div>
    <hr className="FilterBar-separator" />
    <div className="FilterBar">
      <div className="FilterBar-count">123.456 Tokens</div>
      <div className="FilterBar-sort">
        <div className="FilterBar-sort-label">Sort by period:</div>
        <div className="FilterBar-sort-choice">All</div>
        <FontAwesomeIcon
          className="FilterBar-sort-margin"
          icon="caret-down"
          size="xs"
        />
        <div className="FilterBar-sort-choice">Newest</div>
        <FontAwesomeIcon icon="caret-down" size="xs" />
      </div>
    </div>
  </div>
)

export default FilterBar
