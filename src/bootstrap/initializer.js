import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { RenderIf } from 'lessdux'
import { ClimbingBoxLoader } from 'react-spinners'

import * as walletSelectors from '../reducers/wallet'
import * as walletActions from '../actions/wallet'
import RequiresMetaMaskPage from '../containers/requires-meta-mask-page'

import { web3, onlyInfura } from './dapp-api'

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

  state = { interval: null }

  componentDidMount() {
    const { fetchAccounts } = this.props
    fetchAccounts()
  }

  static getDerivedStateFromProps({ accounts }, prevState) {
    clearInterval(prevState.interval)
    return {
      interval: setInterval(() => {
        const currAcc = web3.utils.toChecksumAddress(
          window.web3.eth.defaultAccount
        )
        if (accounts.data && currAcc && accounts.data[0] !== currAcc)
          window.location.reload()
      }, 100)
    }
  }

  componentWillUnmount() {
    clearInterval(this.interval)
  }

  render() {
    const { accounts, children } = this.props
    return (
      <RenderIf
        resource={accounts}
        loading={<ClimbingBoxLoader color="#3d464d" />}
        done={children}
        failedLoading={
          <RequiresMetaMaskPage needsUnlock={Boolean(web3.eth)} web3={web3} />
        }
        extraValues={[
          accounts.data && (accounts.data[0] || onlyInfura || null)
        ]}
        extraFailedValues={[!web3.eth]}
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
