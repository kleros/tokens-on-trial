import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { BeatLoader } from 'react-spinners'

import TokenCard from '../../components/token-card'
import Paging from '../../components/paging'
import FilterBar from '../filter-bar'
import SortBar from '../../components/sort-bar'
import * as badgeSelectors from '../../reducers/badge'
import * as arbitrableAddressListActions from '../../actions/arbitrable-address-list'
import * as badgeActions from '../../actions/badge'
import * as filterActions from '../../actions/filter'
import * as filterSelectors from '../../reducers/filter'
import { filterToContractParam, totalByStatus } from '../../utils/filter'
import { arbitrableAddressList } from '../../bootstrap/dapp-api'

import './badges.css'

const BADGES_PER_PAGE = 40

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

    // Action Dispatchers
    fetchArbitrableAddressListData: PropTypes.func.isRequired,
    fetchBadges: PropTypes.func.isRequired,
    toggleFilter: PropTypes.func.isRequired
  }

  ref = React.createRef()
  fillPageTimeout = null

  componentDidMount() {
    const { fetchArbitrableAddressListData } = this.props
    fetchArbitrableAddressListData()
    this.fetchBadges({})
    arbitrableAddressList.events.AddressStatusChange().on('data', () => {
      this.fetchBadges({})
    })
  }

  mapBadges = tokens => {
    const keys = {}
    if (Array.isArray(tokens))
      return tokens
        .filter(token => {
          if (!keys[token.ID]) {
            keys[token.ID] = true
            return true
          } else return false
        })
        .sort((a, b) => {
          if (a.status > 1 && b.status <= 1) return -1
          if (a.status <= 1 && b.status > 1) return 1
          if (a.token.status > 1 && b.token.status <= 1) return -1
          if (a.token.status <= 1 && b.token.status > 1) return 1
          if (a.token.status > 1 && b.token.status > 1) {
            if (
              !a.token.latestRequest.disputed &&
              b.token.latestRequest.disputed
            )
              return -1
            if (
              a.token.latestRequest.disputed &&
              !b.token.latestRequest.disputed
            )
              return 1
          }
          if (a.status > 1 && b.status > 1) {
            if (!a.latestRequest.disputed && b.latestRequest.disputed) return -1
            if (a.latestRequest.disputed && !b.latestRequest.disputed) return 1
          }
          return 0
        })
        .map(token => <TokenCard key={token.ID} token={token} />)

    return null
  }

  handleFilterChange = key => {
    const { toggleFilter } = this.props
    toggleFilter(key)
    this.fetchBadges({ key })
  }

  handleFirstPageClicked = () => {
    const { history } = this.props
    history.push('/badges')
    this.fetchBadges({ page: '' })
  }

  handlePreviousPageClicked = () => {
    const { badges, history } = this.props
    const { previousPage } = badges.data
    if (previousPage) {
      history.push({ search: `?p=${previousPage}` })
      this.fetchBadges({ page: previousPage })
    } else {
      history.push({ search: `` })
      this.fetchBadges({ page: '' })
    }
  }

  handleNextPageClicked = () => {
    const { badges, history } = this.props
    history.push({ search: `?p=${badges.data[badges.data.length - 1].ID}` })
    this.fetchBadges({ page: badges.data[badges.data.length - 1].ID })
  }

  handleLastPageClicked = () => {
    const { badges, history } = this.props
    history.push({ search: `?p=${badges.data.lastPage}` })
    this.fetchBadges({ page: badges.data.lastPage })
  }

  fetchBadges = ({ key, page }) => {
    const { badges, fetchBadges, filter, location } = this.props
    const pageFromUrl =
      typeof page === 'undefined'
        ? new URLSearchParams(location.search).get('p')
        : page

    const { filters, oldestFirst } = filter
    const updatedFilters = { ...filters }
    if (key) updatedFilters[key] = !filters[key]

    const filterValue = filterToContractParam(updatedFilters)

    if (!badges.loading)
      fetchBadges(
        pageFromUrl && pageFromUrl.length === 66 ? pageFromUrl : '',
        BADGES_PER_PAGE,
        filterValue,
        oldestFirst
      )
  }

  render() {
    const { badges, filter, location } = this.props
    const { filters } = filter

    const currentPage = new URLSearchParams(location.search).get('p')
    let totalFiltered = 0
    if (badges.data && badges.data.countByStatus)
      totalFiltered = totalByStatus(badges.data.countByStatus, filter.filters)

    return (
      <div className="Page" ref={this.ref}>
        <FilterBar
          filter={filters}
          handleFilterChange={this.handleFilterChange}
          filterVisible
        />
        <SortBar items={badges} />
        <div className="TokenGrid">
          <div className="TokenGrid-container">
            {badges.data && !badges.loading ? (
              this.mapBadges(badges.data)
            ) : (
              <div className="TokenGrid-loading">
                <BeatLoader color="#3d464d" />
              </div>
            )}
          </div>
        </div>
        {badges.data && !badges.loading && (
          <Paging
            onFirstPageClick={this.handleFirstPageClicked}
            onPreviousPageClick={this.handlePreviousPageClicked}
            onNextPageClick={this.handleNextPageClicked}
            onLastPageClick={this.handleLastPageClicked}
            currentPage={currentPage}
            maxItemsPerPage={BADGES_PER_PAGE}
            itemCount={badges.data.length}
            lastPage={badges.data.lastPage}
            totalByStatus={totalFiltered}
            currentPageNum={badges.data.currentPage}
            totalPages={badges.data.totalPages}
          />
        )}
      </div>
    )
  }
}

export default withRouter(
  connect(
    state => ({
      badges: state.badge.badges,
      filter: state.filter
    }),
    {
      fetchArbitrableAddressListData:
        arbitrableAddressListActions.fetchArbitrableAddressListData,
      fetchBadges: badgeActions.fetchBadges,
      toggleFilter: filterActions.toggleFilter
    }
  )(Badges)
)
