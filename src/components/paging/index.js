import React from 'react'
import PropTypes from 'prop-types'

import './paging.css'

const Paging = ({
  onNextPageClick,
  onPreviousPageClick,
  onFirstPageClick,
  onLastPageClick,
  currentPage,
  maxItemsPerPage,
  itemCount
}) => (
  <div className="Paging">
    <div className="Paging-navigation">
      <button
        className={`Paging-navigation-button ${
          currentPage ? 'Paging-navigation-clickable' : ''
        }`}
        onClick={onFirstPageClick}
        disabled={!currentPage}
      >
        First
      </button>
      <button
        className={`Paging-navigation-button ${
          currentPage ? 'Paging-navigation-clickable' : ''
        }`}
        onClick={onPreviousPageClick}
        disabled={!currentPage}
      >
        Previous
      </button>
      <button
        className={`Paging-navigation-button ${
          itemCount < maxItemsPerPage ? '' : 'Paging-navigation-clickable'
        }`}
        onClick={onNextPageClick}
        disabled={itemCount < maxItemsPerPage}
      >
        Next
      </button>
      <button
        className={`Paging-navigation-button ${
          itemCount < maxItemsPerPage ? '' : 'Paging-navigation-clickable'
        }`}
        onClick={onLastPageClick}
        disabled={itemCount < maxItemsPerPage}
      >
        Last
      </button>
    </div>
  </div>
)

Paging.propTypes = {
  currentPage: PropTypes.string,
  maxItemsPerPage: PropTypes.number.isRequired,
  itemCount: PropTypes.number.isRequired,

  // Navigation handlers
  onFirstPageClick: PropTypes.func.isRequired,
  onPreviousPageClick: PropTypes.func.isRequired,
  onNextPageClick: PropTypes.func.isRequired,
  onLastPageClick: PropTypes.func.isRequired
}

Paging.defaultProps = {
  currentPage: null
}

export default Paging
