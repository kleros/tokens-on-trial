import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Helmet } from 'react-helmet'
import { Provider, connect } from 'react-redux'
import { ConnectedRouter } from 'react-router-redux'
import { Switch, Route, withRouter } from 'react-router-dom'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'

import Tokens from '../containers/tokens'
import TokenDetail from '../containers/token'
import PageNotFound from '../components/page-not-found'
import NavBar from '../containers/nav-bar'
import ActionModal from '../containers/action-modal'
import Identicon from '../components/identicon'
import * as modalConstants from '../constants/modal'
import * as modalActions from '../actions/modal'
import * as walletSelectors from '../reducers/wallet'
import * as notificationSelectors from '../reducers/notification'
import * as notificationActions from '../actions/notification'
import Button from '../components/button'
import NotificationBadge from '../components/notification-badge'
import SettingsModal from '../components/settings-modal'

import Initializer from './initializer'
import GlobalComponents from './global-components'
import { onlyInfura } from './dapp-api'
import './fontawesome'

import './app.css'

class _ConnectedNavBar extends Component {
  static propTypes = {
    // Navigation
    history: PropTypes.shape({
      push: PropTypes.func.isRequired
    }).isRequired,

    // Redux State
    accounts: walletSelectors.accountsShape.isRequired,
    notifications: notificationSelectors.notificationsShape.isRequired,

    // Action Dispatchers
    openActionModal: PropTypes.func.isRequired,
    deleteNotification: PropTypes.func.isRequired,
    closeNotificationsModal: PropTypes.func.isRequired
  }

  handleSubmitTokenClick = () => {
    const { openActionModal } = this.props
    openActionModal(modalConstants.ACTION_MODAL_ENUM.Submit)
  }

  handleNotificationClick = ({ currentTarget: { id } }) => {
    const { deleteNotification, history, closeNotificationsModal } = this.props
    deleteNotification(id)
    closeNotificationsModal()
    history.push(`/${id}`)
  }

  handleShowAllClick = () => {
    const { history, closeNotificationsModal } = this.props
    closeNotificationsModal()
    history.push(`/notifications`)
  }

  render() {
    const { accounts, notifications } = this.props
    return (
      <NavBar
        routes={[
          { title: 'KLEROS', to: '/', extraStyle: 'NavBar-kleros' },
          {
            title: 'Token² Curated List',
            to: '/',
            extraStyle: 'NavBar-route-title'
          }
        ]}
        extras={[
          <NotificationBadge
            key="1"
            notifications={notifications}
            onNotificationClick={this.handleNotificationClick}
            maxShown={5}
            onShowAll={this.handleShowAllClick}
          >
            <FontAwesomeIcon icon="bell" color="white" />
          </NotificationBadge>,
          <SettingsModal key="2">
            <FontAwesomeIcon icon="envelope" color="white" />
          </SettingsModal>,
          <Identicon address={accounts.data[0]} round scale={2} size={15} />,
          <Button
            tooltip={onlyInfura ? 'Please install MetaMask.' : null}
            onClick={this.handleSubmitTokenClick}
            type="primary"
            disabled={onlyInfura}
            className="Button-submitToken"
          >
            <FontAwesomeIcon icon="plus" className="Button-submitToken-icon" />
            Submit Token
          </Button>
        ]}
      />
    )
  }
}

const ConnectedNavBar = withRouter(
  connect(
    state => ({
      accounts: state.wallet.accounts,
      notifications: state.notification.notifications,
      isNotificationsModalOpen: state.modal.isNotificationsModalOpen
    }),
    {
      deleteNotification: notificationActions.deleteNotification,
      openActionModal: modalActions.openActionModal,
      closeNotificationsModal: modalActions.closeNotificationsModal
    }
  )(_ConnectedNavBar)
)

const App = ({ store, history }) => (
  <Provider store={store}>
    <Initializer>
      <ConnectedRouter history={history}>
        <div id="router-root">
          <Helmet>
            <title>Tokens on Trial</title>
          </Helmet>
          <Route exact path="*" component={ConnectedNavBar} />
          <div id="scroll-root">
            <Switch>
              <Route exact path="/" component={Tokens} />
              <Route exact path="/notifications" component={PageNotFound} />
              <Route exact path="/:tokenID" component={TokenDetail} />
              <Route component={PageNotFound} />
            </Switch>
          </div>
          <Switch>
            <Route exact path="*" component={ActionModal} />
          </Switch>
          <Route exact path="*" component={GlobalComponents} />
        </div>
      </ConnectedRouter>
    </Initializer>
  </Provider>
)

App.propTypes = {
  // State
  store: PropTypes.shape({}).isRequired,
  history: PropTypes.shape({}).isRequired
}

export default App
