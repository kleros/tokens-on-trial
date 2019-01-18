import React, { Component, PureComponent } from 'react'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import PropTypes from 'prop-types'

import Button from '../../components/button'
import * as filterConstants from '../../constants/filter'
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
    handleFilterChange(filterConstants.FILTER_OPTIONS_ENUM[option])
  }

  render() {
    const { type, option, className } = this.props
    return (
      <Button
        className={className}
        onClick={this.onFilterChange}
        size="small"
        type={type}
      >
        {filterConstants.FILTER_OPTIONS_ENUM[option]}
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
            <div className="FilterBar-filter-choice">All</div>
            <FontAwesomeIcon icon="filter" size="xs" />
          </div>
        </div>
        <hr className="FilterBar-separator" />
        {filterOptionsVisible && (
          <div>
            <div className="FilterBar-filterSelect">
              <div className="FilterBar-my">
                {filterConstants.FILTER_OPTIONS_ENUM.indexes
                  .filter(i => i >= 6)
                  .map(i => (
                    <FilterButton
                      className="FilterBar-my-button"
                      handleFilterChange={handleFilterChange}
                      key={i}
                      option={i}
                      type={
                        filter[filterConstants.FILTER_OPTIONS_ENUM[i]]
                          ? 'primary'
                          : 'secondary'
                      }
                    >
                      {filterConstants.FILTER_OPTIONS_ENUM[i]}
                    </FilterButton>
                  ))}
              </div>
              <div className="FilterBar-status">
                {filterConstants.FILTER_OPTIONS_ENUM.indexes
                  .filter(i => i < 6)
                  .map(i => (
                    <FilterButton
                      className={`FilterBar-status-button
                        FilterBar-status-button-${
                          filterConstants.FILTER_OPTIONS_ENUM[i].length <= 10
                            ? `small`
                            : filterConstants.FILTER_OPTIONS_ENUM[i].length <=
                              24
                            ? `medium`
                            : `large`
                        }`}
                      handleFilterChange={handleFilterChange}
                      key={i}
                      option={i}
                      type={
                        filter[filterConstants.FILTER_OPTIONS_ENUM[i]]
                          ? 'primary'
                          : 'secondary'
                      }
                    >
                      {filterConstants.FILTER_OPTIONS_ENUM[i]}
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
