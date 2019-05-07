import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import Dropdown from '../dropdown'
import * as filterConstants from '../../constants/filter'
import * as filterActions from '../../actions/filter'
import * as filterSelectors from '../../reducers/filter'
import { ContractsContext } from '../../bootstrap/contexts'
import { tokensShape } from '../../reducers/token'
import { _arbitrableAddressListDataShape } from '../../reducers/arbitrable-address-list'
import { badgesShape } from '../../reducers/badges'

import './sort-bar.css'

class SortBar extends PureComponent {
  static propTypes = {
    // Redux State
    items: PropTypes.oneOfType([tokensShape, badgesShape]).isRequired,
    filter: filterSelectors.filterShape.isRequired,
    displayedItemsCount: PropTypes.number.isRequired,
    totalFiltered: PropTypes.number.isRequired,
    displayBadgeFilters: PropTypes.bool,
    arbitrableAddressListData: PropTypes.objectOf(
      _arbitrableAddressListDataShape
    ),

    // Action Dispatchers
    setOldestFirst: PropTypes.func.isRequired,
    toggleBadgeFilter: PropTypes.func.isRequired
  }

  static defaultProps = {
    displayBadgeFilters: false,
    arbitrableAddressListData: null
  }

  static contextType = ContractsContext

  handleSortChange = oldestFirst => {
    const { setOldestFirst } = this.props
    const { arbitrableTokenListView } = this.context
    setOldestFirst(oldestFirst, arbitrableTokenListView)
  }

  handleBadgeChange = badgeContractIndexes => {
    const { arbitrableTokenListView } = this.context
    const { toggleBadgeFilter, filter, arbitrableAddressListData } = this.props
    const { badgeFilters } = filter

    Object.keys(arbitrableAddressListData).forEach((addr, i) => {
      if (!badgeContractIndexes.includes(i) && badgeFilters[addr])
        // Disabling badge
        toggleBadgeFilter(addr, arbitrableTokenListView)
      else if (badgeContractIndexes.includes(i) && !badgeFilters[addr])
        // Enabling badge
        toggleBadgeFilter(addr, arbitrableTokenListView)
    })
  }

  componentDidUpdate() {
    const { filter, arbitrableAddressListData, toggleBadgeFilter } = this.props
    if (!this.context || !arbitrableAddressListData) return
    const { arbitrableTokenListView } = this.context
    const { badgeFilters } = filter
    Object.keys(arbitrableAddressListData).forEach(badgeContractAddr => {
      if (!(badgeContractAddr in badgeFilters))
        toggleBadgeFilter(badgeContractAddr, arbitrableTokenListView)
    })
  }

  render() {
    const {
      displayedItemsCount,
      items,
      filter,
      totalFiltered,
      arbitrableAddressListData,
      displayBadgeFilters
    } = this.props
    const { oldestFirst, badgeFilters } = filter
    const selectedBadges = []

    Object.keys(badgeFilters).forEach((badgeContractAddr, i) => {
      if (badgeFilters[badgeContractAddr] === true) selectedBadges.push(i)
    })

    const badgeContracts = arbitrableAddressListData
      ? Object.keys(arbitrableAddressListData).map(badgeContractAddr => ({
          title: arbitrableAddressListData[badgeContractAddr].variables.title,
          badgeContractAddr
        }))
      : []

    return (
      <div className="SortBar">
        <div className="SortBar-count">
          {!items.loading || displayedItemsCount > 0
            ? `${displayedItemsCount} of ${totalFiltered}`
            : 'Loading submissions...'}
        </div>
        <div className="SortBar-sort">
          Sort by:
          <Dropdown
            className="SortBar-dropdowns-dropdown"
            label="Sort"
            onChange={this.handleSortChange}
            options={filterConstants.SORT_OPTIONS_ENUM.values}
            type="radio"
            value={oldestFirst || 0}
          />
          {displayBadgeFilters && (
            <Dropdown
              value={selectedBadges}
              label="Badge Type:"
              type="checkbox"
              options={badgeContracts.map(badgeContract => badgeContract.title)}
              onChange={this.handleBadgeChange}
              className="SortBar-dropdowns-dropdown"
            />
          )}
        </div>
      </div>
    )
  }
}

export default connect(
  state => ({
    filter: state.filter,
    arbitrableAddressListData:
      state.arbitrableAddressList.arbitrableAddressListData.data
  }),
  {
    setOldestFirst: filterActions.setOldestFirst,
    toggleFilter: filterActions.toggleFilter,
    toggleBadgeFilter: filterActions.toggleBadgeFilter
  }
)(SortBar)
