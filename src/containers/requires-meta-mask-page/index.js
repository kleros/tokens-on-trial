import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import * as walletSelectors from '../../reducers/wallet'
import RequiresMetaMask from '../../components/requires-meta-mask'
import Button from '../../components/button'

import './requires-meta-mask-page.css'

class RequiresMetaMaskPage extends PureComponent {
  static propTypes = {
    needsUnlock: PropTypes.bool.isRequired,
    accounts: walletSelectors.accountsShape.isRequired
  }

  componentDidMount() {
    const { accounts } = this.props
    let prevAddr
    window.web3.currentProvider.publicConfigStore.on(
      'update',
      ({ selectedAddress }) => {
        if (
          accounts.data &&
          accounts.data.length === 0 &&
          selectedAddress &&
          !prevAddr
        ) {
          // logging in
          window.location.reload()
          return
        }
        if (!selectedAddress && prevAddr) {
          // logging out
          window.location.reload()
          return
        }
        prevAddr = selectedAddress
      }
    )
  }

  render() {
    const { needsUnlock } = this.props
    return (
      <div className="RequiresMetaMaskPage">
        <RequiresMetaMask needsUnlock={needsUnlock} />
        <div className="RequiresMetaMaskPage-FAQ">
          <h1>Still have questions? Don't worry, we're here to help!</h1>
          <Button
            to="mailto:stuart@kleros.io?Subject=Tokens%20on%20Trial%20Support"
            type="ternary"
            className="RequiresMetaMaskPage-card-button"
          >
            Contact Support
          </Button>
          <Button
            to="https://t.me/kleros"
            type="ternary"
            className="RequiresMetaMaskPage-card-button"
          >
            Ask in Telegram
          </Button>
        </div>
      </div>
    )
  }
}

export default connect(state => ({
  accounts: state.wallet.accounts
}))(RequiresMetaMaskPage)
