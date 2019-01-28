import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import * as modalActions from '../../actions/modal'
import * as walletActions from '../../actions/wallet'
import * as walletSelectors from '../../reducers/wallet'
import Button from '../../components/button'
import NavOverlay from '../../components/nav-overlay'

import { SettingsForm, submitSettingsForm } from './components/settings-form'
import './settings-modal.css'

class SettingsModal extends PureComponent {
  static propTypes = {
    // State
    children: PropTypes.node.isRequired,
    isSettingsModalOpen: PropTypes.oneOf([true, false]).isRequired,
    settings: walletSelectors.settingsShape.isRequired,

    // Handlers
    // openSettingsModal: PropTypes.func.isRequired,
    closeSettingsModal: PropTypes.func.isRequired
  }

  handleOverlayClick = () => {
    const { closeSettingsModal } = this.props
    closeSettingsModal()
  }

  handleOpenSettingsClick = () => {
    // TODO: Enable once implemented.
    // const { openSettingsModal, isSettingsModalOpen } = this.props
    // if (isSettingsModalOpen) return // This method is triggered when clicking on the overlay so we avoid opening it again.
    // openSettingsModal()
  }

  handleUpdateSettingsClick = () => {
    // TODO
  }

  render() {
    const { children, isSettingsModalOpen, settings } = this.props

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
                  executeReady: settings.data.executeReady,
                  challenged: settings.data.challenged,
                  shouldFund: settings.data.shouldFund,
                  rulingGiven: settings.data.rulingGiven
                }}
                onSubmit={this.handleOpenSettingsClick}
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
