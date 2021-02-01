import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { BeatLoader } from 'react-spinners'
import BadgeCard from '../../components/badge-card'
import Paging from '../../components/paging'
import FilterBar from '../filter-bar'
import SortBar from '../../components/sort-bar'
import * as arbitrableAddressListActions from '../../actions/arbitrable-address-list'
import * as filterActions from '../../actions/filter'
import * as tokensActions from '../../actions/tokens'
import * as filterSelectors from '../../reducers/filter'
import { ContractsContext } from '../../bootstrap/contexts'
import { badgesShape } from '../../reducers/badges'
import { tokensShape } from '../../reducers/token'
import { _arbitrableAddressListDataShape } from '../../reducers/arbitrable-address-list'
import './badges.css'

const ITEMS_PER_PAGE = 40

class Badges extends Component {
  static propTypes = {
    // Navigation
    history: PropTypes.shape({
      push: PropTypes.func.isRequired,
    }).isRequired,
    location: PropTypes.shape({
      search: PropTypes.string.isRequired,
    }).isRequired,
    arbitrableAddressListData: PropTypes.objectOf(
      PropTypes.oneOfType([
        PropTypes.shape({
          data: _arbitrableAddressListDataShape,
        }),
        PropTypes.bool,
      ])
    ).isRequired,

    // Redux State
    badges: badgesShape.isRequired,
    tokens: tokensShape.isRequired,
    filter: filterSelectors.filterShape.isRequired,
    accounts: PropTypes.arrayOf(PropTypes.string).isRequired,

    // Action Dispatchers
    toggleFilter: PropTypes.func.isRequired,
    fetchTokens: PropTypes.func.isRequired,
  }

  componentDidMount() {
    // The fetch tokens saga also fetches the badges once its done.
    const { fetchTokens } = this.props
    fetchTokens()
  }

  static contextType = ContractsContext

  state = { currentPage: 0 }

  handleFilterChange = (key) => {
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

  handleLastPageClicked = (lastPage) => {
    this.setState({ currentPage: lastPage })
  }

  render() {
    const {
      badges,
      filter,
      accounts,
      arbitrableAddressListData,
      tokens,
    } = this.props
    const userAccount = accounts[0]

    // Merge badges from all contracts
    const badgesData = Object.keys(badges.data)
      .map((badgeContractAddr) => badges.data[badgeContractAddr])
      .reduce(
        (acc, curr) =>
          acc.concat(Object.keys(curr.items).map((addr) => curr.items[addr])),
        []
      )

    const { filters, badgeFilters } = filter

    const filteredBadges = badgesData
      .filter((badge) => {
        if (userAccount === badge.status.requester && filter['My Submissions'])
          return true
        if (userAccount === badge.status.challenger && filter['My Challenges'])
          return true

        const { clientStatus } = badge
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
      .filter((badge) => badgeFilters[badge.badgeContractAddr])
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
      .sort((a, b) => {
        // Show items crowdfunding state first.
        if (a.inAppealPeriod && !b.inAppealPeriod) return -1
        else if (!a.inAppealPeriod && b.inAppealPeriod) return 1
        else return 0
      })

    const { currentPage } = this.state
    const totalPages = Math.ceil(filteredBadges.length / ITEMS_PER_PAGE)
    const displayedBadges = filteredBadges.slice(
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
          displayedItemsCount={displayedBadges.length}
          items={badges}
          totalFiltered={filteredBadges.length}
          displayBadgeFilters
        />
        <div className="BadgeGrid">
          <div className="BadgeGrid-container">
            {displayedBadges.length === 0 &&
            !tokens.loading &&
            !badges.loading ? (
              <p
                style={{
                  textAlign: 'center',
                  width: '100%',
                  marginTop: '50px',
                }}
              >
                No badges found for the selected filters
              </p>
            ) : (
              <>
                {(displayedBadges.length > 0 ||
                  (!tokens.loading && !badges.loading)) &&
                arbitrableAddressListData.data ? (
                  displayedBadges.map((badge) => (
                    <BadgeCard
                      badge={badge}
                      key={`${badge.address}.${badge.badgeContractAddr}`}
                      arbitrableAddressListData={arbitrableAddressListData.data}
                      displayTokenInfo
                    />
                  ))
                ) : (
                  <div className="BadgeGrid-loading">
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
    (state) => ({
      badges: state.badges,
      tokens: state.tokens,
      filter: state.filter,
      accounts: state.wallet.accounts.data,
      envObjects: state.envObjects.data,
      arbitrableAddressListData:
        state.arbitrableAddressList.arbitrableAddressListData,
    }),
    {
      fetchArbitrableAddressListData:
        arbitrableAddressListActions.fetchArbitrableAddressListData,
      toggleFilter: filterActions.toggleFilter,
      fetchTokens: tokensActions.fetchTokens,
    }
  )(Badges)
)
