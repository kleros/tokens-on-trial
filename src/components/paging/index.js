import React from 'react'
import PropTypes from 'prop-types'

import './paging.css'

const Paging = ({
  onNextPageClick,
  onPreviousPageClick,
  onFirstPageClick,
  onLastPageClick,
  currentPage,
  totalPages
}) => (
  <div className="Paging">
    <span>{`Page ${currentPage + 1} of ${
      totalPages === 0 ? 1 : totalPages
    }`}</span>
    <div className="Paging-navigation">
      <button
        className={`Paging-navigation-button ${
          currentPage !== 0 ? 'Paging-navigation-clickable' : ''
        }`}
        onClick={onFirstPageClick}
        disabled={currentPage === 0}
      >
        First
      </button>
      <button
        className={`Paging-navigation-button ${
          currentPage !== 0 ? 'Paging-navigation-clickable' : ''
        }`}
        onClick={onPreviousPageClick}
        disabled={currentPage === 0}
      >
        Previous
      </button>
      <button
        className={`Paging-navigation-button ${
          totalPages === 0 || currentPage === totalPages - 1
            ? ''
            : 'Paging-navigation-clickable'
        }`}
        onClick={onNextPageClick}
        disabled={totalPages === 0 || currentPage === totalPages - 1}
      >
        Next
      </button>
      {/* eslint-disable react/jsx-no-bind */}
      <button
        className={`Paging-navigation-button ${
          totalPages === 0 || currentPage === totalPages - 1
            ? ''
            : 'Paging-navigation-clickable'
        }`}
        onClick={() => onLastPageClick(totalPages - 1)}
        disabled={totalPages === 0 || currentPage === totalPages - 1}
      >
        Last
      </button>
    </div>
  </div>
)

Paging.propTypes = {
  currentPage: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,

  // Navigation handlers
  onFirstPageClick: PropTypes.func.isRequired,
  onPreviousPageClick: PropTypes.func.isRequired,
  onNextPageClick: PropTypes.func.isRequired,
  onLastPageClick: PropTypes.func.isRequired
}

export default Paging
