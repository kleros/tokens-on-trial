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
import { ContractsContext } from '../../bootstrap/contexts'

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
    envObjects: PropTypes.shape({
      networkID: PropTypes.number.isRequired
    }).isRequired,

    // Dispatchers
    toggleFilter: PropTypes.func.isRequired
  }

  static contextType = ContractsContext

  state = { currentPage: 0 }

  handleFilterChange = key => {
    const { toggleFilter } = this.props
    const { arbitrableTokenListView } = this.context
    toggleFilter(key, arbitrableTokenListView)
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
    const { tokens, badges, filter, accounts, envObjects } = this.props
    const { networkID } = envObjects
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
      .filter(
        token =>
          // These tokens have disputes (on the kovan testnet) with an AutoAppealableArbitrator
          // as the arbitrator, which is currently not supported by the UI.
          // Hide them from the list.
          networkID !== 42 ||
          (token.ID !==
            '0x94dd28a2ced5d59541f0aaedc4192cd32f8e8c15ea752ae4f9fc8fee6cac0a9a' &&
            token.ID !==
              '0xac31c437ede12028c57a8112d4df4566f28051c6447ed2a2e2dcc4f88d8a6865' &&
            token.ID !==
              '0x488db20cbe8d6b36dbf9e1db8e4fbda80692074330a2391cb67859b314034b67' &&
            token.ID !==
              '0xf69ce03f1e563398463cf2672ca220da670d9af3d27843e8d5c5069c455ea3de')
      )
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
      accounts: state.wallet.accounts.data,
      envObjects: state.envObjects.data
    }),
    {
      toggleFilter: filterActions.toggleFilter
    }
  )(Tokens)
)
