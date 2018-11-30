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
import * as tokenConstants from '../../constants/token'
import { filterToContractParam, defaultFilter } from '../../utils/filter'

import './tokens.css'

class Tokens extends Component {
  static propTypes = {
    // Redux State
    tokens: tokenSelectors.tokensShape.isRequired,

    // Action Dispatchers
    fetchArbitrableTokenListData: PropTypes.func.isRequired,
    fetchTokens: PropTypes.func.isRequired
  }

  state = {
    sortValue: 0,
    sort: { [tokenConstants.SORT_OPTIONS_ENUM[0]]: 'ascending' },
    filter: defaultFilter()
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
    const { filter } = this.state
    filter[key] = !filter[key]
    this.setState({ filter }, () => this.fetchTokens(true))
  }

  fetchTokens = clear => {
    const { tokens, fetchTokens } = this.props
    const { filter, sortValue } = this.state
    const filterValue = filterToContractParam(filter)
    if (!tokens.loading)
      fetchTokens(
        tokens.data && clear !== true
          ? tokens.data[tokens.data.length - 1].ID
          : '0x00',
        10,
        filterValue,
        sortValue
      )
  }

  render() {
    const { tokens } = this.props
    const { filter } = this.state

    let numTokens = 'Loading...'
    if (tokens && tokens.data) numTokens = tokens.data.length

    return (
      <div ref={this.ref} className="Page">
        <FilterBar
          filter={filter}
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
    tokens: state.token.tokens
  }),
  {
    fetchArbitrableTokenListData:
      arbitrableTokenListActions.fetchArbitrableTokenListData,
    fetchTokens: tokenActions.fetchTokens
  }
)(Tokens)
