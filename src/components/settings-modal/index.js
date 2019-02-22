import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import * as modalActions from '../../actions/modal'
import * as walletActions from '../../actions/wallet'
import * as walletSelectors from '../../reducers/wallet'
import Button from '../../components/button'
import NavOverlay from '../../components/nav-overlay'
import { web3 } from '../../bootstrap/dapp-api'

import { SettingsForm, submitSettingsForm } from './components/settings-form'
import './settings-modal.css'

class SettingsModal extends PureComponent {
  static propTypes = {
    // State
    children: PropTypes.node.isRequired,
    isSettingsModalOpen: PropTypes.oneOf([true, false]).isRequired,
    settings: walletSelectors.settingsShape.isRequired,
    accounts: walletSelectors.accountsShape.isRequired,

    // Handlers
    closeSettingsModal: PropTypes.func.isRequired,
    openSettingsModal: PropTypes.func.isRequired,
    submitSettingsForm: PropTypes.func.isRequired
  }

  handleOverlayClick = () => {
    const { closeSettingsModal } = this.props
    closeSettingsModal()
  }

  handleOpenSettingsClick = () => {
    const { openSettingsModal, isSettingsModalOpen } = this.props
    if (isSettingsModalOpen) return // This method is triggered when clicking on the overlay so we avoid opening it again.
    openSettingsModal()
  }

  handleUpdateSettingsClick = async ({ name, email, ...rest }) => {
    const { accounts } = this.props
    const settings = {
      name: { S: name },
      email: { S: email },
      ...Object.keys(rest).reduce((acc, v) => {
        acc[
          `t2crNotificationSetting${`${v[0].toUpperCase()}${v.slice(1)}`}`
        ] = {
          BOOL: rest[v] || false
        }
        return acc
      }, {})
    }

    try {
      await (await fetch(process.env.REACT_APP_PATCH_USER_SETTINGS_URL, {
        body: JSON.stringify({
          payload: {
            address: accounts.data[0],
            settings,
            signature: await web3.eth.personal.sign(
              JSON.stringify(settings),
              accounts.data[0]
            )
          }
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'PATCH'
      })).json()
    } catch (err) {
      console.error(err)
    }
  }

  render() {
    const {
      children,
      isSettingsModalOpen,
      settings,
      submitSettingsForm
    } = this.props

    return (
      <div className="SettingsModal" onClick={this.handleOpenSettingsClick}>
        {children}
        {isSettingsModalOpen && (
          <div>
            <NavOverlay onClick={this.handleOverlayClick} />
            <div className="SettingsModal-window">
              <h4 className="SettingsModal-window-title">
                Register to receive notifications by email
              </h4>
              <hr style={{ margin: 0, marginBottom: '15px' }} />
              <span>You will be informed when:</span>
              <SettingsForm
                className="SettingsModal-window-form"
                initialValues={{
                  dispute: settings.data.dispute,
                  rulingGiven: settings.data.rulingGiven,
                  shouldFund: settings.data.shouldFund
                }}
                onSubmit={this.handleUpdateSettingsClick}
              />
              <div className="SettingsModal-window-submit">
                <Button
                  className="SettingsModal-window-submit-button"
                  onClick={submitSettingsForm}
                >
                  Register
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }
}

export default connect(
  state => ({
    accounts: state.wallet.accounts,
    isSettingsModalOpen: state.modal.isSettingsModalOpen,
    settings: state.wallet.settings
  }),
  {
    openSettingsModal: modalActions.openSettingsModal,
    closeSettingsModal: modalActions.closeSettingsModal,
    updateSettings: walletActions.updateSettings,
    submitSettingsForm
  }
)(SettingsModal)
