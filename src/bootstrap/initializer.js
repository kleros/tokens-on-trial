import React, { PureComponent, Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { RenderIf } from 'lessdux'
import { BeatLoader } from 'react-spinners'

import * as walletSelectors from '../reducers/wallet'
import * as walletActions from '../actions/wallet'
import * as initializationActions from '../actions/initialization'
import * as arbitrableTokenListActions from '../actions/arbitrable-token-list'
import * as arbitrableAddressListActions from '../actions/arbitrable-address-list'
import * as tokensActions from '../actions/tokens'
import * as badgesActions from '../actions/badges'
import { instantiateEnvObjects } from '../utils/tcr'

import { ContractsContext } from './contexts'

class ContractsProvider extends Component {
  static propTypes = {
    children: PropTypes.node.isRequired,
    fetchAccounts: PropTypes.func.isRequired
  }

  state = {}

  async componentDidMount() {
    const envObjects = await instantiateEnvObjects()
    this.setState({ envObjects })
  }

  async componentDidUpdate() {
    const { fetchAccounts } = this.props
    const { envObjects, accountChangeListener } = this.state

    if (!envObjects || accountChangeListener) return

    if (window.ethereum)
      this.setState(prevState => {
        if (prevState.accountChangeListener) return prevState
        return {
          accountChangeListener: window.ethereum.on('accountsChanged', () => {
            fetchAccounts()
          })
        }
      })
  }

  render() {
    const { envObjects } = this.state
    const { children } = this.props
    return (
      <ContractsContext.Provider value={envObjects}>
        {children}
      </ContractsContext.Provider>
    )
  }
}

class Initializer extends PureComponent {
  static propTypes = {
    // Redux State
    accounts: walletSelectors.accountsShape.isRequired,

    // Action Dispatchers
    fetchAccounts: PropTypes.func.isRequired,
    fetchArbitrableTokenListData: PropTypes.func.isRequired,
    fetchArbitrableAddressListData: PropTypes.func.isRequired,
    fetchTokens: PropTypes.func.isRequired,
    fetchBadges: PropTypes.func.isRequired,
    initialize: PropTypes.func.isRequired,

    // State
    children: PropTypes.oneOfType([
      PropTypes.element,
      PropTypes.arrayOf(PropTypes.element.isRequired)
    ]).isRequired
  }

  async componentDidMount() {
    const {
      fetchArbitrableAddressListData,
      fetchArbitrableTokenListData,
      fetchTokens,
      fetchBadges,
      fetchAccounts,
      initialize
    } = this.props

    initialize()
    fetchAccounts()
    fetchArbitrableTokenListData()
    fetchArbitrableAddressListData()
    fetchTokens()
    fetchBadges()
  }

  render() {
    const { accounts, children, fetchAccounts } = this.props
    return (
      <RenderIf
        done={
          <ContractsProvider fetchAccounts={fetchAccounts}>
            {children}
          </ContractsProvider>
        }
        extraLoadingValues={[
          !accounts.data || (window.ethereum && accounts.data.length === 0)
        ]}
        loading={
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              flexDirection: 'column',
              justifyContent: 'center',
              height: '100vh'
            }}
          >
            <BeatLoader color="#3d464d" />
          </div>
        }
        failedLoading="There was an error loading your statuses..."
        resource={accounts}
      />
    )
  }
}

export default connect(
  state => ({
    accounts: state.wallet.accounts
  }),
  {
    fetchAccounts: walletActions.fetchAccounts,
    fetchArbitrableAddressListData:
      arbitrableAddressListActions.fetchArbitrableAddressListData,
    fetchArbitrableTokenListData:
      arbitrableTokenListActions.fetchArbitrableTokenListData,
    fetchTokens: tokensActions.fetchTokens,
    fetchBadges: badgesActions.fetchBadges,
    initialize: initializationActions.initialize
  }
)(Initializer)
