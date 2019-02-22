import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { RenderIf } from 'lessdux'
import { BeatLoader } from 'react-spinners'

import * as walletSelectors from '../reducers/wallet'
import * as walletActions from '../actions/wallet'
import RequiresMetaMaskPage from '../containers/requires-meta-mask-page'

import {
  onlyInfura,
  web3,
  network as networkPromise,
  requiredNetwork
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

    let prevAddr
    window.web3.currentProvider.publicConfigStore.on(
      'update',
      ({ selectedAddress }) => {
        selectedAddress = web3.utils.toChecksumAddress(selectedAddress)
        if (prevAddr !== selectedAddress) {
          prevAddr = selectedAddress
          fetchAccounts()
        }
        // if (!selectedAddress && prevAddr) {
        //   // Logging out
        //   fetchAccounts()
        // }
      }
    )
  }

  render() {
    const { accounts, children } = this.props
    const { metamaskNetwork } = this.state
    console.info('res', Boolean(web3))
    return (
      <RenderIf
        done={children}
        extraFailedValues={[!web3, requiredNetwork !== metamaskNetwork]}
        extraValues={[
          accounts.data && (accounts.data[0] || onlyInfura || null)
        ]}
        failedLoading={
          <RequiresMetaMaskPage
            needsUnlock={Boolean(web3.eth.accounts[0])}
            needsMetamask={Boolean(!web3)}
            requiredNetwork={requiredNetwork}
            metamaskNetwork={metamaskNetwork}
            web3={web3}
          />
        }
        loading={
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              flexDirection: 'column'
            }}
          >
            <p>Waiting Metamask Unlock</p>
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
