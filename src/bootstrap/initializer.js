import React, { PureComponent, Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { RenderIf } from 'lessdux'
import { BeatLoader } from 'react-spinners'
import * as walletSelectors from '../reducers/wallet'
import * as walletActions from '../actions/wallet'
import * as initializationActions from '../actions/initialization'
import * as arbitratorActions from '../actions/arbitrator'
import * as arbitrableTokenListActions from '../actions/arbitrable-token-list'
import * as arbitrableAddressListActions from '../actions/arbitrable-address-list'
import IncorrectNetwork from '../components/incorrect-network'
import { instantiateEnvObjects } from '../utils/tcr'
import { APP_VERSION } from './dapp-api'
import { notificationsShape } from '../reducers/notification'
import { ContractsContext } from './contexts'
import './app.css'

class ContractsProvider extends Component {
  static propTypes = {
    children: PropTypes.node.isRequired,
    fetchAccounts: PropTypes.func.isRequired,
    notifications: notificationsShape.isRequired,
    envObjects: PropTypes.shape({
      networkID: PropTypes.number.isRequired,
    }).isRequired,
  }

  state = {}

  async componentDidMount() {
    const envObjects = await instantiateEnvObjects()
    const { arbitrableTokenListView } = envObjects
    this.setState({ envObjects })

    // Save notifications on unload.
    window.addEventListener('unload', () => {
      const {
        notifications: { data },
      } = this.props
      localStorage.setItem(
        `${arbitrableTokenListView.options.address}.notifications@${APP_VERSION}`,
        JSON.stringify(data)
      )
    })
  }

  async componentDidUpdate() {
    const { fetchAccounts } = this.props
    const { envObjects, accountChangeListener } = this.state

    if (!envObjects || accountChangeListener) return

    if (window.ethereum)
      this.setState((prevState) => {
        if (prevState.accountChangeListener) return prevState
        return {
          accountChangeListener: window.ethereum.on('accountsChanged', () => {
            fetchAccounts()
          }),
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
    fetchArbitratorData: PropTypes.func.isRequired,
    initialize: PropTypes.func.isRequired,

    // State
    children: PropTypes.oneOfType([
      PropTypes.element,
      PropTypes.arrayOf(PropTypes.element.isRequired),
    ]).isRequired,
    envObjects: PropTypes.shape({
      networkID: PropTypes.number.isRequired,
    }),
  }

  static defaultProps = {
    envObjects: null,
  }

  async componentDidMount() {
    const {
      fetchArbitrableAddressListData,
      fetchArbitrableTokenListData,
      fetchArbitratorData,
      fetchAccounts,
      initialize,
    } = this.props

    initialize()
    fetchAccounts()
    fetchArbitrableTokenListData()
    fetchArbitrableAddressListData()
    fetchArbitratorData()
  }

  render() {
    const { accounts, children, envObjects } = this.props

    if (!envObjects) return null

    if (envObjects && envObjects.networkID !== 1 && envObjects.networkID !== 42)
      return <IncorrectNetwork />

    return (
      <RenderIf
        done={<ContractsProvider {...this.props}>{children}</ContractsProvider>}
        extraLoadingValues={[
          !accounts.data || (window.ethereum && accounts.data.length === 0),
        ]}
        loading={
          <div className="InitializerLoading">
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
  (state) => ({
    accounts: state.wallet.accounts,
    notifications: state.notification.notifications,
    envObjects: state.envObjects.data,
  }),
  {
    fetchAccounts: walletActions.fetchAccounts,
    fetchArbitrableAddressListData:
      arbitrableAddressListActions.fetchArbitrableAddressListData,
    fetchArbitrableTokenListData:
      arbitrableTokenListActions.fetchArbitrableTokenListData,
    fetchArbitratorData: arbitratorActions.fetchArbitratorData,
    initialize: initializationActions.initialize,
  }
)(Initializer)
