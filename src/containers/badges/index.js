import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { BeatLoader } from 'react-spinners'

import BadgeCard from '../../components/badge-card'
import FilterBar from '../filter-bar'
import SortBar from '../../components/sort-bar'
import * as badgeSelectors from '../../reducers/badge'
import * as arbitrableAddressListActions from '../../actions/arbitrable-address-list'
import * as badgeActions from '../../actions/badge'
import * as filterActions from '../../actions/filter'
import * as filterSelectors from '../../reducers/filter'

import './badges.css'

class Badges extends Component {
  static propTypes = {
    // Navigation
    history: PropTypes.shape({
      push: PropTypes.func.isRequired
    }).isRequired,
    location: PropTypes.shape({
      search: PropTypes.string.isRequired
    }).isRequired,

    // Redux State
    badges: badgeSelectors.badgesShape.isRequired,
    filter: filterSelectors.filterShape.isRequired,
    accounts: PropTypes.arrayOf(PropTypes.string).isRequired,

    // Action Dispatchers
    toggleFilter: PropTypes.func.isRequired
  }

  handleFilterChange = key => {
    const { toggleFilter } = this.props
    toggleFilter(key)
  }

  render() {
    const { badges, filter, accounts } = this.props
    const userAccount = accounts[0]
    const badgesData = badges.data
    const { filters } = filter

    const displayedBadges = Object.keys(badgesData.items)
      .map(address => badgesData.items[address])
      .filter(badge => {
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

    return (
      <div className="Page">
        <FilterBar
          filter={filters}
          handleFilterChange={this.handleFilterChange}
          filterVisible
        />
        <SortBar displayedItemsCount={displayedBadges.length} items={badges} />
        <div className="BadgeGrid">
          <div className="BadgeGrid-container">
            {displayedBadges.length === 0 && !badges.loading ? (
              <p
                style={{
                  textAlign: 'center',
                  width: '100%',
                  marginTop: '50px'
                }}
              >
                No badges found for the selected filters
              </p>
            ) : (
              <>
                {displayedBadges.length > 0 || !badges.loading ? (
                  displayedBadges.map(badge => (
                    <BadgeCard
                      badge={badge}
                      key={badge.address}
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
        </div>
      </div>
    )
  }
}

export default withRouter(
  connect(
    state => ({
      badges: state.badges,
      tokens: state.tokens,
      filter: state.filter,
      accounts: state.wallet.accounts.data
    }),
    {
      fetchArbitrableAddressListData:
        arbitrableAddressListActions.fetchArbitrableAddressListData,
      fetchBadges: badgeActions.fetchBadges,
      toggleFilter: filterActions.toggleFilter
    }
  )(Badges)
)
