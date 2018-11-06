import React, { Component, PureComponent } from 'react'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import PropTypes from 'prop-types'

import Button from '../button'
import * as tokenConstants from '../../constants/token'

import './filter-bar.css'

class FilterButton extends PureComponent {
  static propTypes = {
    option: PropTypes.number.isRequired,
    handleFilterChange: PropTypes.func.isRequired,
    type: PropTypes.string.isRequired,
    className: PropTypes.string.isRequired
  }

  onFilterChange = () => {
    const { option, handleFilterChange } = this.props
    handleFilterChange(tokenConstants.FILTER_OPTIONS_ENUM[option])
  }

  render() {
    const { type, option, className } = this.props
    return (
      <Button
        className={className}
        size="small"
        type={type}
        onClick={this.onFilterChange}
      >
        {tokenConstants.FILTER_OPTIONS_ENUM[option]}
      </Button>
    )
  }
}

class FilterBar extends Component {
  static propTypes = {
    // State
    filter: PropTypes.shape({}).isRequired,

    // Handlers
    handleFilterChange: PropTypes.func.isRequired
  }

  state = {
    filterOptionsVisible: false
  }

  toggleFilterOptions = () => {
    const { filterOptionsVisible } = this.state
    this.setState({ filterOptionsVisible: !filterOptionsVisible })
  }

  render() {
    const { filter, handleFilterChange } = this.props
    const { filterOptionsVisible } = this.state

    return (
      <div>
        <div className="FilterBar">
          <div className="FilterBar-search">
            <FontAwesomeIcon icon="search" />
            <input className="FilterBar-search-input" placeholder="Search" />
          </div>
          <div className="FilterBar-filter" onClick={this.toggleFilterOptions}>
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
                    <FilterButton
                      key={i}
                      option={i}
                      className="FilterBar-my-button"
                      type={
                        filter[tokenConstants.FILTER_OPTIONS_ENUM[i]]
                          ? 'primary'
                          : 'secondary'
                      }
                      handleFilterChange={handleFilterChange}
                    >
                      {tokenConstants.FILTER_OPTIONS_ENUM[i]}
                    </FilterButton>
                  ))}
              </div>
              <div className="FilterBar-status">
                {tokenConstants.FILTER_OPTIONS_ENUM.indexes
                  .filter(i => i < 6)
                  .map(i => (
                    <FilterButton
                      key={i}
                      option={i}
                      className={`FilterBar-status-button
                        FilterBar-status-button-${
                          tokenConstants.FILTER_OPTIONS_ENUM[i].length <= 10
                            ? `small`
                            : tokenConstants.FILTER_OPTIONS_ENUM[i].length <= 24
                              ? `medium`
                              : `large`
                        }`}
                      type={
                        filter[tokenConstants.FILTER_OPTIONS_ENUM[i]]
                          ? 'primary'
                          : 'secondary'
                      }
                      handleFilterChange={handleFilterChange}
                    >
                      {tokenConstants.FILTER_OPTIONS_ENUM[i]}
                    </FilterButton>
                  ))}
              </div>
            </div>
            <hr className="FilterBar-separator-neon" />
          </div>
        )}
      </div>
    )
  }
}

export default FilterBar
