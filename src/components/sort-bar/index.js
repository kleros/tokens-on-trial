import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import Dropdown from '../dropdown'
import * as filterConstants from '../../constants/filter'
import * as filterActions from '../../actions/filter'
import * as filterSelectors from '../../reducers/filter'
import { ContractsContext } from '../../bootstrap/contexts'

import './sort-bar.css'

class SortBar extends PureComponent {
  static propTypes = {
    // Redux State
    items: PropTypes.shape({
      data: PropTypes.shape({
        items: PropTypes.arrayOf(PropTypes.shape({})).isRequired
      }).isRequired
    }).isRequired,
    filter: filterSelectors.filterShape.isRequired,
    displayedItemsCount: PropTypes.number.isRequired,
    totalFiltered: PropTypes.number.isRequired,

    // Action Dispatchers
    setOldestFirst: PropTypes.func.isRequired
  }

  static contextType = ContractsContext

  handleSortChange = oldestFirst => {
    const { setOldestFirst } = this.props
    const { arbitrableTokenListView } = this.context
    setOldestFirst(oldestFirst, arbitrableTokenListView)
  }

  render() {
    const { displayedItemsCount, items, filter, totalFiltered } = this.props
    const { oldestFirst } = filter

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
        </div>
      </div>
    )
  }
}

export default connect(
  state => ({
    filter: state.filter
  }),
  {
    setOldestFirst: filterActions.setOldestFirst,
    toggleFilter: filterActions.toggleFilter
  }
)(SortBar)
