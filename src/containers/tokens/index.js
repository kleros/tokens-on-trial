import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
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

const TOKENS_PER_PAGE = 10

class Tokens extends Component {
  static propTypes = {
    // Navigation
    history: PropTypes.shape({
      push: PropTypes.func.isRequired
    }).isRequired,
    match: PropTypes.shape({
      params: PropTypes.shape({
        page: PropTypes.string.isRequired
      }).isRequired
    }).isRequired,

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
    const keys = {}
    if (Array.isArray(tokens))
      return tokens
        .filter(token => {
          if (!keys[token.ID]) {
            keys[token.ID] = true
            return true
          } else return false
        })
        .map(token => <TokenCard key={token.ID} token={token} />)
    return null
  })

  handleFilterChange = key => {
    const { toggleFilter } = this.props
    toggleFilter(key)
    this.fetchTokens(true, key)
  }

  handlePageClicked = page => () => {
    const { history } = this.props
    history.push(`/tokens/${page}`)
  }

  handleNextPageClicked = () => {
    const { match, history } = this.props
    const { page } = match.params
    history.push(`/tokens/${page + 1}`)
  }

  handlePreviousPageClicked = () => {
    const { match, history } = this.props
    const { page } = match.params
    history.push(`/tokens/${page - 1}`)
  }

  fetchTokens = (clear, key) => {
    const { tokens, fetchTokens, filter, match } = this.props
    const { page } = match.params

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
          : '',
        TOKENS_PER_PAGE,
        filterValue,
        oldestFirst,
        page
      )
  }

  render() {
    const { tokens, filter } = this.props
    const { filters } = filter

    let numTokens = 'Loading...'
    let numPages = 0

    if (tokens && tokens.data) {
      numTokens = tokens.data.length
      numPages =
        tokens.totalCount % 2 === 0
          ? tokens.totalCount / TOKENS_PER_PAGE
          : tokens.totalCount / TOKENS_PER_PAGE + 1
    }

    return (
      <div className="Page" ref={this.ref}>
        <FilterBar
          filter={filters}
          handleFilterChange={this.handleFilterChange}
        />
        <SortBar numTokens={numTokens} />
        <div className="TokenGrid">
          <div className="TokenGrid-container">
            {tokens.data && this.mapTokens(tokens.data)}
          </div>
          <div className="TokenGrid-paging">
            <div className="TokenGrid-paging-numbers">
              {numPages > 0 &&
                [...new Array(numPages).keys()].map(key => (
                  <button
                    className="TokenGrid-paging-numbers-number TokenGrid-paging-numbers"
                    onClick={this.handlePageClicked(key + 1)}
                  >
                    {key}
                  </button>
                ))}
            </div>
            {numPages > 0 && (
              <div className="TokenGrid-paging-navigation">
                <button
                  className="TokenGrid-paging-navigation-button"
                  onClick={this.handleNextPageClicked}
                >
                  Previous
                </button>
                <button
                  className="TokenGrid-paging-navigation-button TokenGrid-paging-navigation-clickable"
                  onClick={this.handlePreviousPageClicked}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }
}

export default withRouter(
  connect(
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
)
