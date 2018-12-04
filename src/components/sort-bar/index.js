import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import Dropdown from '../dropdown'
import * as filterConstants from '../../constants/filter'
import * as filterActions from '../../actions/filter'
import * as tokenActions from '../../actions/token'
import * as tokenSelectors from '../../reducers/token'
import * as filterSelectors from '../../reducers/filter'
import { filterToContractParam } from '../../utils/filter'

import './sort-bar.css'

class SortBar extends PureComponent {
  static propTypes = {
    // Redux State
    tokens: tokenSelectors.tokensShape.isRequired,
    oldestFirst: filterSelectors.oldestFirstShape.isRequired,
    filters: filterSelectors.filtersShape.isRequired,

    // Action Dispatchers
    setOldestFirst: PropTypes.func.isRequired,
    fetchTokens: PropTypes.func.isRequired
  }

  handleSortChange = oldestFirst => {
    const { setOldestFirst, fetchTokens, tokens, filters } = this.props
    setOldestFirst(oldestFirst)
    const filterValue = filterToContractParam(filters)
    if (!tokens.loading) fetchTokens('0x00', 10, filterValue, oldestFirst)
  }

  render() {
    const { tokens, oldestFirst } = this.props
    const tokensData = tokens.data
    return (
      <div className="SortBar">
        <div className="SortBar-count">
          {tokensData ? tokensData.length : 'Loading'} submissions
        </div>
        <div className="SortBar-sort">
          <Dropdown
            value={oldestFirst || 0}
            type="radio"
            label="Sort"
            options={filterConstants.SORT_OPTIONS_ENUM.values}
            onChange={this.handleSortChange}
            className="SortBar-dropdowns-dropdown"
          />
        </div>
      </div>
    )
  }
}

export default connect(
  state => ({
    tokens: state.token.tokens,
    oldestFirst: state.filter.oldestFirst,
    filters: state.filter.filters
  }),
  {
    setOldestFirst: filterActions.setOldestFirst,
    fetchTokens: tokenActions.fetchTokens,
    toggleFilter: filterActions.toggleFilter
  }
)(SortBar)
