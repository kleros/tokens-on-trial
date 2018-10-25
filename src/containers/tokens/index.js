import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import memoizeOne from 'memoize-one'
import { RenderIf } from 'lessdux'
import ReactInfiniteScroller from 'react-infinite-scroller'
import PieChart from 'react-minimal-pie-chart'
import { BeatLoader, ClimbingBoxLoader } from 'react-spinners'

import { IMAGES_BASE_URL } from '../../bootstrap/dapp-api'
import * as walletSelectors from '../../reducers/wallet'
import * as arbitrableTokenListSelectors from '../../reducers/arbitrable-token-list'
import * as arbitrableTokenListActions from '../../actions/arbitrable-token-list'
import * as tokenSelectors from '../../reducers/token'
import * as tokenActions from '../../actions/token'
import * as modalActions from '../../actions/modal'
import Dropdown from '../../components/dropdown'
import MasonryGrid from '../../components/masonry-grid'
import TokenCard from '../../components/token-card'
import * as tokenConstants from '../../constants/token'
import * as modalConstants from '../../constants/modal'

import './tokens.css'

class Tokens extends PureComponent {
  static propTypes = {
    // Redux State
    accounts: walletSelectors.accountsShape.isRequired,
    arbitrableTokenListData:
      arbitrableTokenListSelectors.arbitrableTokenListDataShape.isRequired,
    tokens: tokenSelectors.tokensShape.isRequired,

    // Action Dispatchers
    fetchArbitrableTokenListData: PropTypes.func.isRequired,
    fetchTokens: PropTypes.func.isRequired,
    fetchToken: PropTypes.func.isRequired,
    openTokenModal: PropTypes.func.isRequired
  }

  state = {
    filterValue: tokenConstants.FILTER_OPTIONS_ENUM.indexes.filter(
      i =>
        i !== tokenConstants.FILTER_OPTIONS_ENUM.Challenged &&
        i !== tokenConstants.FILTER_OPTIONS_ENUM.Rejected
    ),
    filter: tokenConstants.FILTER_OPTIONS_ENUM.values.filter(
      v =>
        v !==
          tokenConstants.FILTER_OPTIONS_ENUM[
            tokenConstants.FILTER_OPTIONS_ENUM.Challenged
          ] &&
        v !==
          tokenConstants.FILTER_OPTIONS_ENUM[
            tokenConstants.FILTER_OPTIONS_ENUM.Rejected
          ]
    ),
    sortValue: 0,
    sort: { [tokenConstants.SORT_OPTIONS_ENUM[0]]: 'ascending' }
  }

  ref = React.createRef()
  fillPageTimeout = null

  componentDidMount() {
    const { fetchArbitrableTokenListData } = this.props
    fetchArbitrableTokenListData()
    this.fetchTokens(true)
  }

  componentDidUpdate(prevProps) {
    const { tokens: prevTokens } = prevProps
    const { tokens } = this.props
    clearTimeout(this.fillPageTimeout)
    this.fillPageTimeout = setTimeout(() => {
      if (
        prevTokens !== tokens &&
        !tokens.loading &&
        tokens.data &&
        tokens.data.hasMore &&
        this.ref.current.clientHeight === this.ref.current.scrollHeight
      )
        this.fetchTokens()
    }, 500)
  }

  getFilterOptionsWithCountsAndColors = memoizeOne((accounts, tokens = []) =>
    tokenConstants.FILTER_OPTIONS_ENUM.values.map(value => {
      let label = value
      let count
      switch (tokenConstants.FILTER_OPTIONS_ENUM[value]) {
        case tokenConstants.FILTER_OPTIONS_ENUM.Pending:
        case tokenConstants.FILTER_OPTIONS_ENUM.Challenged:
        case tokenConstants.FILTER_OPTIONS_ENUM.Accepted:
        case tokenConstants.FILTER_OPTIONS_ENUM.Rejected:
          label =
            tokenConstants.FILTER_OPTIONS_ENUM[value] ===
              tokenConstants.FILTER_OPTIONS_ENUM.Challenged ||
            tokenConstants.FILTER_OPTIONS_ENUM[value] ===
              tokenConstants.FILTER_OPTIONS_ENUM.Rejected
              ? `${label} (NSFW)`
              : label
          count = tokens.filter(
            token => token.status === tokenConstants.FILTER_OPTIONS_ENUM[value]
          ).length
          break
        case tokenConstants.FILTER_OPTIONS_ENUM['My Submissions']:
          count = tokens.filter(token => token.submitter === accounts[0]).length
          break
        case tokenConstants.FILTER_OPTIONS_ENUM['My Challenges']:
          count = tokens.filter(token => token.challenger === accounts[0])
            .length
          break
        default:
          count = 0
          break
      }

      return {
        label,
        count,
        color:
          tokenConstants.STATUS_COLOR_ENUM[tokenConstants.STATUS_ENUM[value]]
      }
    })
  )

  mapTokens = memoizeOne((accounts, tokens) =>
    tokens.map(token => (
      <TokenCard
        key={token.ID}
        id={token.ID}
        status={tokenConstants.STATUS_ENUM[token.status]}
        imageSrc={IMAGES_BASE_URL + token.ID}
        onClick={this.handleTokenCardClick}
        masonryGridFilterValues={[
          tokenConstants.STATUS_ENUM[token.status],
          accounts[0] === token.submitter &&
            tokenConstants.FILTER_OPTIONS_ENUM[
              tokenConstants.FILTER_OPTIONS_ENUM['My Submissions']
            ],
          accounts[0] === token.challenger &&
            tokenConstants.FILTER_OPTIONS_ENUM[
              tokenConstants.FILTER_OPTIONS_ENUM['My Challenges']
            ]
        ]}
        masonryGridSortValues={{
          Newest: -token.lastAction,
          Oldest: token.lastAction,
          'Challenges ↑': token.disputed,
          'Challenges ↓': !token.disputed
        }}
      >
        {tokenConstants.STATUS_ENUM[token.status]}
      </TokenCard>
    ))
  )

  handleFilterChange = value =>
    this.setState(
      {
        filterValue: value,
        filter: value.map(v => tokenConstants.FILTER_OPTIONS_ENUM[v])
      },
      () => this.fetchTokens(true)
    )

  handleSortChange = value =>
    this.setState(
      {
        sortValue: value,
        sort: {
          [tokenConstants.SORT_OPTIONS_ENUM[value]]: 'ascending'
        }
      },
      () => this.fetchTokens(true)
    )

  handleTokenCardClick = ({ currentTarget: { id } }) => {
    const { fetchToken, openTokenModal } = this.props
    fetchToken(id, true)
    openTokenModal(modalConstants.TOKEN_MODAL_ENUM.Details)
  }

  fetchTokens = clear => {
    const { tokens, fetchTokens } = this.props
    const { filterValue, sortValue } = this.state
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
    const { accounts, arbitrableTokenListData, tokens } = this.props
    const { filterValue, filter, sortValue, sort } = this.state
    return (
      <div ref={this.ref} className="Tokens">
        <ReactInfiniteScroller
          hasMore={tokens.data ? tokens.data.hasMore : false}
          loadMore={this.fetchTokens}
          loader={
            <div key={0} className="Tokens-masonryGridLoader">
              <BeatLoader color="#3d464d" />
            </div>
          }
          useWindow={false}
        >
          <div className="Tokens-settingsBar">
            <RenderIf
              resource={arbitrableTokenListData}
              loading={
                <div className="Tokens-settingsBar-countsLoader">
                  <BeatLoader color="#3d464d" />
                </div>
              }
              done={
                arbitrableTokenListData.data && (
                  <div className="Tokens-settingsBar-counts">
                    <div className="Tokens-settingsBar-counts-counters">
                      {Object.keys(
                        arbitrableTokenListData.data.itemsCounts
                      ).map(label => (
                        <div
                          key={label}
                          className="Tokens-settingsBar-counts-counters-counter"
                        >
                          <span className="Tokens-settingsBar-counts-counters-counter-label">
                            {label}:
                          </span>{' '}
                          <span className="Tokens-settingsBar-counts-counters-counter-number">
                            {arbitrableTokenListData.data.itemsCounts[label]}
                            <div
                              className={`Tokens-settingsBar-counts-counters-counter-number-tag Tokens-settingsBar-counts-counters-counter-number-tag--${label.toLowerCase()}`}
                            />
                          </span>
                        </div>
                      ))}
                    </div>
                    <PieChart
                      data={[
                        {
                          value:
                            arbitrableTokenListData.data.itemsCounts.Pending,
                          color: '#0059ab'
                        },
                        {
                          value:
                            arbitrableTokenListData.data.itemsCounts.Challenged,
                          color: '#ffbe61'
                        },
                        {
                          value:
                            arbitrableTokenListData.data.itemsCounts.Accepted,
                          color: '#47cf73'
                        },
                        {
                          value:
                            arbitrableTokenListData.data.itemsCounts.Rejected,
                          color: '#ff364f'
                        }
                      ]}
                      lineWidth={25}
                      animate
                      className="Tokens-settingsBar-counts-pie"
                    />
                  </div>
                )
              }
              failedLoading={null}
            />
            <div className="Tokens-settingsBar-dropdowns">
              <Dropdown
                value={filterValue}
                type="checkbox"
                label="Filter"
                options={this.getFilterOptionsWithCountsAndColors(
                  accounts.data,
                  tokens.data || undefined
                )}
                onChange={this.handleFilterChange}
                inverted
                className="Tokens-settingsBar-dropdowns-dropdown"
              />
              <Dropdown
                value={sortValue}
                type="radio"
                options={tokenConstants.SORT_OPTIONS_ENUM.values}
                onChange={this.handleSortChange}
                className="Tokens-settingsBar-dropdowns-dropdown"
              />
            </div>
          </div>
          <RenderIf
            resource={tokens}
            loading={
              tokens.data ? (
                <MasonryGrid filter={filter} sort={sort}>
                  {this.mapTokens(accounts.data, tokens.data)}
                </MasonryGrid>
              ) : (
                <div className="Tokens-masonryGridLoader">
                  <ClimbingBoxLoader color="#3d464d" />
                </div>
              )
            }
            done={
              tokens.data && (
                <MasonryGrid filter={filter} sort={sort}>
                  {this.mapTokens(accounts.data, tokens.data)}
                </MasonryGrid>
              )
            }
            failedLoading="There was an error fetching the tokens. Make sure you are connected to the right Ethereum network."
          />
        </ReactInfiniteScroller>
      </div>
    )
  }
}

export default connect(
  state => ({
    accounts: state.wallet.accounts,
    arbitrableTokenListData: state.arbitrableTokenList.arbitrableTokenListData,
    tokens: state.token.tokens
  }),
  {
    fetchArbitrableTokenListData:
      arbitrableTokenListActions.fetchArbitrableTokenListData,
    fetchTokens: tokenActions.fetchTokens,
    fetchToken: tokenActions.fetchToken,
    openTokenModal: modalActions.openTokenModal
  }
)(Tokens)
