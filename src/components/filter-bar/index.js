import React from 'react'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import PropTypes from 'prop-types'

import Button from '../button'
import * as tokenConstants from '../../constants/token'

import './filter-bar.css'

const FilterBar = ({ filterOptionsVisible, toggleFilterOptions, filter }) => (
  <div>
    <div className="FilterBar">
      <div className="FilterBar-search">
        <FontAwesomeIcon icon="search" />
        <input className="FilterBar-search-input" placeholder="Search" />
      </div>
      <div className="FilterBar-filter" onClick={toggleFilterOptions}>
        <div className="FilterBar-filter-label">Filter:</div>
        <div className="FilterBar-filter-choice">Registered</div>
        <FontAwesomeIcon icon="filter" size="xs" />
      </div>
    </div>
    <hr className="FilterBar-separator" />
    {filterOptionsVisible && (
      <div>
        <div className="FilterBar-filterSelect">
          <div className="FilterBar-my">
            {tokenConstants.FILTER_OPTIONS_ENUM.indexes
              .filter(i => i >= 6)
              .map(i => (
                <Button
                  key={i}
                  className="FilterBar-my-button"
                  size="small"
                  type={
                    filter[tokenConstants.FILTER_OPTIONS_ENUM[i]]
                      ? 'primary'
                      : 'secondary'
                  }
                >
                  {tokenConstants.FILTER_OPTIONS_ENUM[i]}
                </Button>
              ))}
          </div>
          <div className="FilterBar-status">
            {tokenConstants.FILTER_OPTIONS_ENUM.indexes
              .filter(i => i < 6)
              .map(i => (
                <Button
                  key={i}
                  className={`FilterBar-status-button
                    FilterBar-status-button-${
                      tokenConstants.FILTER_OPTIONS_ENUM[i].length <= 10
                        ? `small`
                        : tokenConstants.FILTER_OPTIONS_ENUM[i].length <= 24
                          ? `medium`
                          : `large`
                    }`}
                  size="small"
                  type={
                    filter[tokenConstants.FILTER_OPTIONS_ENUM[i]]
                      ? 'primary'
                      : 'secondary'
                  }
                >
                  {tokenConstants.FILTER_OPTIONS_ENUM[i]}
                </Button>
              ))}
          </div>
        </div>
        <hr className="FilterBar-separator-neon" />
      </div>
    )}
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

FilterBar.propTypes = {
  // State
  filterOptionsVisible: PropTypes.bool.isRequired,
  filter: PropTypes.shape({}).isRequired,

  // Handlers
  toggleFilterOptions: PropTypes.func.isRequired
}

export default FilterBar
