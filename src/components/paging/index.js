import React from 'react'
import PropTypes from 'prop-types'

import './paging.css'

const Paging = ({
  numPages,
  onNextPageClick,
  onPreviousPageClick,
  onPageClick,
  page
}) => (
  <div className="Paging">
    <div className="Paging-numbers">
      {numPages > 0 &&
        [...new Array(numPages).keys()].map(key => (
          <button
            className={`Paging-numbers-number ${
              key + 1 === Number(page) ? 'Paging-numbers-number-active' : ''
            }`}
            onClick={
              key + 1 !== Number(page) ? onPageClick(key + 1) : undefined
            }
            key={key}
          >
            {key + 1}
          </button>
        ))}
    </div>
    {numPages > 0 && (
      <div className="Paging-navigation">
        <button
          className={`Paging-navigation-button ${
            Number(page) > 1 ? 'Paging-navigation-clickable' : ''
          }`}
          onClick={onNextPageClick}
        >
          Previous
        </button>
        <button
          className={`Paging-navigation-button ${
            Number(page) < numPages ? 'Paging-navigation-clickable' : ''
          }`}
          onClick={onPreviousPageClick}
        >
          Next
        </button>
      </div>
    )}
  </div>
)

Paging.propTypes = {
  numPages: PropTypes.number.isRequired,
  onNextPageClick: PropTypes.func.isRequired,
  onPreviousPageClick: PropTypes.func.isRequired,
  onPageClick: PropTypes.func.isRequired,
  page: PropTypes.string.isRequired
}

export default Paging
