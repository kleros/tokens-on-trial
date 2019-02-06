import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
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
import { filterToContractParam, totalByStatus } from '../../utils/filter'
import { arbitrableTokenList } from '../../bootstrap/dapp-api'

import './tokens.css'

const TOKENS_PER_PAGE = 12

class Tokens extends Component {
  static propTypes = {
    // Navigation
    history: PropTypes.shape({
      push: PropTypes.func.isRequired
    }).isRequired,
    location: PropTypes.shape({
      search: PropTypes.string.isRequired
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
    this.fetchTokens({})
    arbitrableTokenList.events.TokenStatusChange().on('data', () => {
      this.fetchTokens({})
    })
  }

  mapTokens = tokens => {
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
  }

  handleFilterChange = key => {
    const { toggleFilter } = this.props
    toggleFilter(key)
    this.fetchTokens({ key })
  }

  handleFirstPageClicked = () => {
    const { history } = this.props
    history.push('/tokens')
    this.fetchTokens({ page: '' })
  }

  handlePreviousPageClicked = () => {
    const { tokens, history } = this.props
    const { previousPage } = tokens.data
    if (previousPage) {
      history.push({ search: `?p=${previousPage}` })
      this.fetchTokens({ page: previousPage })
    } else {
      history.push({ search: `` })
      this.fetchTokens({ page: '' })
    }
  }

  handleNextPageClicked = () => {
    const { tokens, history } = this.props
    history.push({ search: `?p=${tokens.data[tokens.data.length - 1].ID}` })
    this.fetchTokens({ page: tokens.data[tokens.data.length - 1].ID })
  }

  handleLastPageClicked = () => {
    const { tokens, history } = this.props
    history.push({ search: `?p=${tokens.data.lastPage}` })
    this.fetchTokens({ page: tokens.data.lastPage })
  }

  fetchTokens = ({ key, page }) => {
    const { tokens, fetchTokens, filter, location } = this.props
    const pageFromUrl =
      typeof page === 'undefined'
        ? new URLSearchParams(location.search).get('p')
        : page

    const { filters, oldestFirst } = filter
    const updatedFilters = { ...filters }
    if (key) updatedFilters[key] = !filters[key]

    const filterValue = filterToContractParam(updatedFilters)

    if (!tokens.loading)
      fetchTokens(
        pageFromUrl && pageFromUrl.length === 66 ? pageFromUrl : '',
        TOKENS_PER_PAGE,
        filterValue,
        oldestFirst
      )
  }

  render() {
    const { tokens, filter, location } = this.props
    const { filters } = filter

    const currentPage = new URLSearchParams(location.search).get('p')
    let totalFiltered = 0
    if (tokens.data && tokens.data.countByStatus)
      totalFiltered = totalByStatus(tokens.data.countByStatus, filter.filters)

    return (
      <div className="Page" ref={this.ref}>
        <FilterBar
          filter={filters}
          handleFilterChange={this.handleFilterChange}
          filterVisible
        />
        <SortBar />
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
        </div>
        {tokens.data && !tokens.loading && (
          <Paging
            onFirstPageClick={this.handleFirstPageClicked}
            onPreviousPageClick={this.handlePreviousPageClicked}
            onNextPageClick={this.handleNextPageClicked}
            onLastPageClick={this.handleLastPageClicked}
            currentPage={currentPage}
            maxItemsPerPage={TOKENS_PER_PAGE}
            itemCount={tokens.data.length}
            lastPage={tokens.data.lastPage}
            totalByStatus={totalFiltered}
            currentPageNum={tokens.data.currentPage}
            totalPages={tokens.data.totalPages}
          />
        )}
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
