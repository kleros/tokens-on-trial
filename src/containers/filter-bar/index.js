import React, { Component, PureComponent } from 'react'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import PropTypes from 'prop-types'
import Button from '../../components/button'
import SearchBar from '../search'
import * as filterConstants from '../../constants/filter'
import { userFriendlyLabel } from '../../utils/ui'
import './filter-bar.css'

class FilterButton extends PureComponent {
  static propTypes = {
    option: PropTypes.number.isRequired,
    handleFilterChange: PropTypes.func.isRequired,
    type: PropTypes.string.isRequired,
    className: PropTypes.string.isRequired,
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
        {userFriendlyLabel[filterConstants.FILTER_OPTIONS_ENUM[option]]}
      </Button>
    )
  }
}

class FilterBar extends Component {
  static propTypes = {
    // State
    filter: PropTypes.shape({}).isRequired,

    // Handlers
    handleFilterChange: PropTypes.func.isRequired,
    filterVisible: PropTypes.bool,
  }

  static defaultProps = {
    filterVisible: false,
  }

  state = {
    filterOptionsVisible: false,
  }

  toggleFilterOptions = () => {
    const { filterOptionsVisible } = this.state
    this.setState({ filterOptionsVisible: !filterOptionsVisible })
  }

  render() {
    const { filter, handleFilterChange, filterVisible } = this.props
    const { filterOptionsVisible } = this.state

    return (
      <>
        <div className="FilterBar">
          <SearchBar />
          {filterVisible && (
            <div
              className="FilterBar-filter"
              onClick={this.toggleFilterOptions}
            >
              <FontAwesomeIcon icon="filter" size="xs" />
              <div className="FilterBar-filter-label">Filter</div>
            </div>
          )}
        </div>
        <hr className="FilterBar-separator" />
        {filterOptionsVisible && (
          <div>
            <div className="FilterBar-filterSelect">
              <div className="FilterBar-my">
                {filterConstants.FILTER_OPTIONS_ENUM.indexes
                  .filter((i) => i >= 6)
                  .map((i) => (
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
                  .filter((i) => i < 6)
                  .map((i) => (
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
            <hr className="FilterBar-separator-primaryBlue" />
          </div>
        )}
      </>
    )
  }
}

export default FilterBar
