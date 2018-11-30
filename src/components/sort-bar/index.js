import React from 'react'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import PropTypes from 'prop-types'

import './sort-bar.css'

const SortBar = ({ numTokens }) => (
  <div className="SortBar">
    <div className="SortBar-count">{numTokens} Submissions</div>
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

SortBar.propTypes = {
  numTokens: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    .isRequired
}

export default SortBar
