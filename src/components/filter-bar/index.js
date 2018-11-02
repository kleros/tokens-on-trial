import React from 'react'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import PropTypes from 'prop-types'

import Button from '../button'

import './filter-bar.css'

const FilterBar = ({ filterOptionsVisible, toggleFilterOptions }) => (
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
            <Button
              className="FilterBar-my-button"
              size="small"
              type="secondary"
            >
              My Submissions
            </Button>
            <Button
              className="FilterBar-my-button"
              size="small"
              type="secondary"
            >
              My Challenges
            </Button>
          </div>
          <div className="FilterBar-status">
            <Button
              className="FilterBar-status-button FilterBar-status-button-small"
              size="small"
              type="primary"
            >
              Registered
            </Button>
            <Button
              className="FilterBar-status-button FilterBar-status-button-medium"
              size="small"
              type="secondary"
            >
              Registration Requests
            </Button>
            <Button
              className="FilterBar-status-button FilterBar-status-button-large"
              size="small"
              type="secondary"
            >
              Challenged Registration Requests
            </Button>
            <Button
              className="FilterBar-status-button FilterBar-status-button-small"
              size="small"
              type="secondary"
            >
              Cleared
            </Button>
            <Button
              className="FilterBar-status-button FilterBar-status-button-medium"
              size="small"
              type="secondary"
            >
              Clearing Requests
            </Button>
            <Button
              className="FilterBar-status-button FilterBar-status-button-large"
              size="small"
              type="secondary"
            >
              Challenged Clearing Requests
            </Button>
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
  filterOptionsVisible: PropTypes.bool.isRequired,
  toggleFilterOptions: PropTypes.func.isRequired
}

export default FilterBar
