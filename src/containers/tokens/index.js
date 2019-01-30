import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import memoizeOne from 'memoize-one'
import { BeatLoader } from 'react-spinners'

import TokenCard from '../../components/token-card'
import Paging from '../../components/paging'
import FilterBar from '../filter-bar'
import SortBar from '../../components/sort-bar'
import * as tokenSelectors from '../../reducers/token'
import * as arbitrableTokenListActions from '../../actions/arbitrable-token-list'
import * as arbitrableAddressListActions from '../../actions/arbitrable-address-list'
import * as tokenActions from '../../actions/token'
import * as filterActions from '../../actions/filter'
import * as filterSelectors from '../../reducers/filter'
import { filterToContractParam } from '../../utils/filter'

import './tokens.css'

const TOKENS_PER_PAGE = 20

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
    fetchArbitrableAddressListData: PropTypes.func.isRequired,
    fetchTokens: PropTypes.func.isRequired,
    toggleFilter: PropTypes.func.isRequired
  }

  ref = React.createRef()
  fillPageTimeout = null

  componentDidMount() {
    const {
      fetchArbitrableTokenListData,
      fetchArbitrableAddressListData
    } = this.props
    fetchArbitrableTokenListData()
    fetchArbitrableAddressListData()
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
    const { tokens, filter, match } = this.props
    const { page } = match.params
    const { filters } = filter

    let numTokens = 'Loading...'
    let numPages = 0

    if (tokens && tokens.data) {
      numTokens = tokens.data.length
      numPages =
        tokens.data.totalCount <= TOKENS_PER_PAGE
          ? 1
          : tokens.data.totalCount % TOKENS_PER_PAGE === 0
          ? tokens.data.totalCount / TOKENS_PER_PAGE
          : Math.floor(tokens.data.totalCount / TOKENS_PER_PAGE) + 1
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
            {tokens.data && !tokens.loading ? (
              this.mapTokens(tokens.data)
            ) : (
              <div className="TokenGrid-loading">
                <BeatLoader color="#3d464d" />
              </div>
            )}
          </div>
          <Paging
            numPages={numPages}
            onNextPageClick={this.handleNextPageClicked}
            onPreviousPageClick={this.handlePreviousPageClicked}
            onPageClick={this.handlePageClicked}
            page={page}
          />
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
      fetchArbitrableAddressListData:
        arbitrableAddressListActions.fetchArbitrableAddressListData,
      fetchTokens: tokenActions.fetchTokens,
      toggleFilter: filterActions.toggleFilter
    }
  )(Tokens)
)
