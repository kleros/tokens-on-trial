import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { BeatLoader } from 'react-spinners'

import TokenCard from '../../components/token-card'
import * as tokenSelectors from '../../reducers/token'
import * as arbitrableTokenListActions from '../../actions/arbitrable-token-list'
import * as arbitrableAddressListActions from '../../actions/arbitrable-address-list'
import * as tokenActions from '../../actions/token'
import * as filterActions from '../../actions/filter'

import './tokens.css'

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
    }).isRequired
  }

  ref = React.createRef()
  fillPageTimeout = null

  render() {
    const { tokens, badges } = this.props

    return (
      <div className="Page" ref={this.ref}>
        <div className="TokenGrid">
          <div className="TokenGrid-container">
            {tokens ? (
              Object.keys(tokens.items).map(tokenID => {
                if (!tokens.items[tokenID]) {
                  console.info(tokenID)
                  return null
                }
                return (
                  <TokenCard
                    token={tokens.items[tokenID]}
                    key={tokens.items[tokenID].ID}
                    badge={badges.items[tokens.items[tokenID].address]}
                  />
                )
              })
            ) : (
              <div className="TokenGrid-loading">
                <BeatLoader color="#3d464d" />
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
      tokens: state.tokens.data,
      badges: state.badges.data,
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
