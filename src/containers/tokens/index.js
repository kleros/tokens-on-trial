import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { BeatLoader } from 'react-spinners'

import TokenCard from '../../components/token-card'
import FilterBar from '../filter-bar'
import Paging from '../../components/paging'
import SortBar from '../../components/sort-bar'
import * as tokenSelectors from '../../reducers/token'
import * as filterActions from '../../actions/filter'

import './tokens.css'

const ITEMS_PER_PAGE = 40

class Tokens extends Component {
  static propTypes = {
    // Navigation
    history: PropTypes.shape({
      push: PropTypes.func.isRequired
    }).isRequired,

    // Redux State
    tokens: tokenSelectors.tokensShape.isRequired,
    badges: PropTypes.shape({
      statusBlockNumber: PropTypes.number.isRequired
    }).isRequired,
    accounts: PropTypes.arrayOf(PropTypes.string).isRequired,
    filter: PropTypes.shape({}).isRequired,

    // Dispatchers
    toggleFilter: PropTypes.func.isRequired
  }

  state = { currentPage: 0 }

  handleFilterChange = key => {
    const { toggleFilter } = this.props
    toggleFilter(key)
  }

  handleFirstPageClicked = () => {
    this.setState({ currentPage: 0 })
  }

  handlePreviousPageClicked = () => {
    const { currentPage } = this.state
    this.setState({ currentPage: currentPage - 1 })
  }

  handleNextPageClicked = () => {
    const { currentPage } = this.state
    this.setState({ currentPage: currentPage + 1 })
  }

  handleLastPageClicked = lastPage => {
    this.setState({ currentPage: lastPage })
  }

  render() {
    const { tokens, badges, filter, accounts } = this.props
    const tokensData = tokens.data
    const userAccount = accounts[0]
    const { filters } = filter
    let filteredTokens = []
    Object.keys(tokensData.items).forEach(tokenID => {
      filteredTokens.push(tokensData.items[tokenID])
    })
    filteredTokens = filteredTokens
      .filter(token => {
        if (userAccount === token.status.requester && filter['My Submissions'])
          return true
        if (userAccount === token.status.challenger && filter['My Challenges'])
          return true

        const { clientStatus } = token
        if (clientStatus === 0 && filters.Absent) return true
        if (clientStatus === 1 && filters.Registered) return true
        if (clientStatus === 2 && filters['Registration Requests']) return true
        if (clientStatus === 3 && filters['Clearing Requests']) return true
        if (clientStatus === 4 && filters['Challenged Registration Requests'])
          return true
        if (clientStatus === 5 && filters['Challenged Clearing Requests'])
          return true

        return false
      })
      .sort((a, b) => {
        const { oldestFirst } = filter
        if (oldestFirst) return a.blockNumber < b.blockNumber ? -1 : 1
        else return a.blockNumber > b.blockNumber ? -1 : 1
      })
      .sort((a, b) => {
        if (a.clientStatus > b.clientStatus) return -1
        if (b.clientStatus > a.clientStatus) return 1
        return 0
      })

    const { currentPage } = this.state
    const totalPages = Math.ceil(filteredTokens.length / ITEMS_PER_PAGE)
    const displayedTokens = filteredTokens.slice(
      currentPage * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE + ITEMS_PER_PAGE
    )

    return (
      <div className="Page">
        <FilterBar
          filter={filters}
          handleFilterChange={this.handleFilterChange}
          filterVisible
        />
        <SortBar
          displayedItemsCount={displayedTokens.length}
          items={tokens}
          totalFiltered={filteredTokens.length}
        />
        <div className="TokenGrid">
          <div className="TokenGrid-container">
            {displayedTokens.length === 0 && !tokens.loading ? (
              <p
                style={{
                  textAlign: 'center',
                  width: '100%',
                  marginTop: '50px'
                }}
              >
                No tokens found for the selected filters
              </p>
            ) : (
              <>
                {displayedTokens.length > 0 || !tokens.loading ? (
                  displayedTokens.map(token => (
                    <TokenCard
                      token={token}
                      key={token.ID}
                      badge={badges.data.items[token.address]}
                    />
                  ))
                ) : (
                  <div className="TokenGrid-loading">
                    <BeatLoader color="#3d464d" />
                  </div>
                )}
              </>
            )}
          </div>
          <Paging
            onFirstPageClick={this.handleFirstPageClicked}
            onPreviousPageClick={this.handlePreviousPageClicked}
            onNextPageClick={this.handleNextPageClicked}
            onLastPageClick={this.handleLastPageClicked}
            currentPage={currentPage}
            totalPages={totalPages}
          />
        </div>
      </div>
    )
  }
}

export default withRouter(
  connect(
    state => ({
      tokens: state.tokens,
      badges: state.badges,
      filter: state.filter,
      accounts: state.wallet.accounts.data
    }),
    {
      toggleFilter: filterActions.toggleFilter
    }
  )(Tokens)
)
