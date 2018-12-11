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

  componentDidMount() {
    const { fetchAccounts } = this.props
    fetchAccounts()
  }

  componentDidUpdate({ accounts }) {
    web3.currentProvider.publicConfigStore.on(
      'update',
      ({ selectedAddress }) => {
        console.info('update', accounts.data)
        console.info('selected', selectedAddress)
        if (
          accounts &&
          accounts.data &&
          accounts.data.length > 0 &&
          selectedAddress &&
          web3.utils.toChecksumAddress(selectedAddress) !==
            web3.utils.toChecksumAddress(accounts.data[0])
        )
          // switching accounts
          window.location.reload()
      }
    )
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
