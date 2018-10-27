import React from 'react'
import { connect } from 'react-redux'

import TitleBar from '../../components/title-bar'
import * as arbitrableTokenListActions from '../../actions/arbitrable-token-list'

import './tokens.css'

const Tokens = () => (
  <div ref={this.ref} className="Tokens">
    <TitleBar />
    <h2>TODO</h2>
  </div>
)

export default connect(
  state => ({
    accounts: state.wallet.accounts,
    arbitrableTokenListData: state.arbitrableTokenList.arbitrableTokenListData
  }),
  {
    fetchArbitrableTokenListData:
      arbitrableTokenListActions.fetchArbitrableTokenListData
  }
)(Tokens)
