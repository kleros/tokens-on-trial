import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { RenderIf } from 'lessdux'
import { BeatLoader } from 'react-spinners'

import * as walletSelectors from '../reducers/wallet'
import * as walletActions from '../actions/wallet'
import RequiresMetaMaskPage from '../containers/requires-meta-mask-page'

import {
  web3,
  network as networkPromise,
  requiredNetwork,
  onlyInfura
} from './dapp-api'

class Initializer extends PureComponent {
  static propTypes = {
    // Redux State
    accounts: walletSelectors.accountsShape.isRequired,

    // Action Dispatchers
    fetchAccounts: PropTypes.func.isRequired,

    // State
    children: PropTypes.oneOfType([
      PropTypes.element,
      PropTypes.arrayOf(PropTypes.element.isRequired)
    ]).isRequired
  }

  state = { metamaskNetwork: null }

  async componentDidMount() {
    const { fetchAccounts } = this.props
    this.setState({ metamaskNetwork: await networkPromise })
    fetchAccounts()

    if (window.ethereum)
      window.ethereum.on('accountsChanged', () => {
        fetchAccounts()
      })
  }

  render() {
    const { accounts, children } = this.props
    const { metamaskNetwork } = this.state
    return (
      <RenderIf
        done={children}
        extraFailedValues={[
          typeof metamaskNetwork === 'string' &&
            requiredNetwork !== metamaskNetwork
        ]}
        failedLoading={
          <>
            <RequiresMetaMaskPage
              needsUnlock={web3 && Boolean(web3.eth.accounts[0])}
              needsMetamask={Boolean(onlyInfura)}
              requiredNetwork={requiredNetwork}
              metamaskNetwork={metamaskNetwork}
            />
          </>
        }
        extraLoadingValues={[
          !accounts.data || accounts.data.length === 0,
          !metamaskNetwork
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
        resource={accounts}
      />
    )
  }
}

export default connect(
  state => ({
    accounts: state.wallet.accounts
  }),
  { fetchAccounts: walletActions.fetchAccounts }
)(Initializer)
