import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import Dropdown from '../dropdown'
import * as filterConstants from '../../constants/filter'
import * as filterActions from '../../actions/filter'
import * as tokenActions from '../../actions/token'
import * as tokenSelectors from '../../reducers/token'
import * as filterSelectors from '../../reducers/filter'
import { filterToContractParam, totalByStatus } from '../../utils/filter'

import './sort-bar.css'

class SortBar extends PureComponent {
  static propTypes = {
    // Redux State
    tokens: PropTypes.shape({
      data: PropTypes.arrayOf(tokenSelectors._tokenShape.isRequired)
    }).isRequired,
    filter: filterSelectors.filterShape.isRequired,

    // Action Dispatchers
    setOldestFirst: PropTypes.func.isRequired,
    fetchTokens: PropTypes.func.isRequired
  }

  handleSortChange = oldestFirst => {
    const { setOldestFirst, fetchTokens, tokens, filter } = this.props
    const { filters } = filter
    setOldestFirst(oldestFirst)
    const filterValue = filterToContractParam(filters)
    if (!tokens.loading) fetchTokens('', 10, filterValue, oldestFirst)
  }

  render() {
    const { tokens, filter } = this.props
    const { oldestFirst } = filter
    const tokensData = tokens.data

    let numTokens = 0
    if (tokensData && tokensData && tokensData.countByStatus)
      numTokens = totalByStatus(tokensData.countByStatus, filter.filters)

    return (
      <div className="SortBar">
        <div className="SortBar-count">
          {tokensData &&
          typeof tokensData.totalCount !== 'undefined' &&
          typeof numTokens !== 'undefined'
            ? `${tokens.data.length} submissions of ${tokensData.totalCount}`
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
    tokens: state.token.tokens,
    filter: state.filter
  }),
  {
    setOldestFirst: filterActions.setOldestFirst,
    fetchTokens: tokenActions.fetchTokens,
    toggleFilter: filterActions.toggleFilter
  }
)(SortBar)
