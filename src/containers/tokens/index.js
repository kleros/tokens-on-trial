import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import memoizeOne from 'memoize-one'

import TokenCard from '../../components/token-card'
import FilterBar from '../filter-bar'
import SortBar from '../../components/sort-bar'
import * as tokenSelectors from '../../reducers/token'
import * as arbitrableTokenListActions from '../../actions/arbitrable-token-list'
import * as tokenActions from '../../actions/token'
import * as filterActions from '../../actions/filter'
import * as filterSelectors from '../../reducers/filter'
import { filterToContractParam } from '../../utils/filter'

import './tokens.css'

class Tokens extends Component {
  static propTypes = {
    // Redux State
    tokens: tokenSelectors.tokensShape.isRequired,
    filter: filterSelectors.filterShape.isRequired,

    // Action Dispatchers
    fetchArbitrableTokenListData: PropTypes.func.isRequired,
    fetchTokens: PropTypes.func.isRequired,
    toggleFilter: PropTypes.func.isRequired
  }

  ref = React.createRef()
  fillPageTimeout = null

  componentDidMount() {
    const { fetchArbitrableTokenListData } = this.props
    fetchArbitrableTokenListData()
    this.fetchTokens(true)
  }

  mapTokens = memoizeOne(tokens => {
    if (Array.isArray(tokens))
      return tokens.map(token => <TokenCard key={token.ID} token={token} />)
    return null
  })

  handleFilterChange = key => {
    const { toggleFilter } = this.props
    toggleFilter(key)
    this.fetchTokens(true, key)
  }

  fetchTokens = (clear, key) => {
    const { tokens, fetchTokens, filter } = this.props
    const { filters, oldestFirst } = filter
    const updatedFilters = {
      ...filters,
      [key]: !filters[key]
    }

    const filterValue = filterToContractParam(updatedFilters)

    if (!tokens.loading)
      fetchTokens(
        tokens.data && clear !== true
          ? tokens.data[tokens.data.length - 1].ID
          : '0x00',
        10,
        filterValue,
        oldestFirst
      )
  }

  render() {
    const { tokens, filter } = this.props
    const { filters } = filter

    let numTokens = 'Loading...'
    if (tokens && tokens.data) numTokens = tokens.data.length

    return (
      <div ref={this.ref} className="Page">
        <FilterBar
          filter={filters}
          handleFilterChange={this.handleFilterChange}
        />
        <SortBar numTokens={numTokens} />
        <div className="TokenGrid">
          <div className="TokenGrid-container">
            {tokens.data && this.mapTokens(tokens.data)}
          </div>
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
    fetchArbitrableTokenListData:
      arbitrableTokenListActions.fetchArbitrableTokenListData,
    fetchTokens: tokenActions.fetchTokens,
    toggleFilter: filterActions.toggleFilter
  }
)(Tokens)
