import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Helmet } from 'react-helmet'
import { Provider, connect } from 'react-redux'
import { ConnectedRouter } from 'react-router-redux'
import { Redirect, Route, Switch, withRouter } from 'react-router-dom'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'

import Tokens from '../containers/tokens'
import TokenDetails from '../containers/token'
import BadgeDetails from '../containers/badge'
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
    history.push(`/token/${id}`)
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
        extras={[
          <NotificationBadge
            key="1"
            maxShown={5}
            notifications={notifications}
            onNotificationClick={this.handleNotificationClick}
            onShowAll={this.handleShowAllClick}
          >
            <FontAwesomeIcon color="white" icon="bell" />
          </NotificationBadge>,
          <SettingsModal key="2">
            <FontAwesomeIcon color="white" icon="envelope" />
          </SettingsModal>,
          <Identicon address={accounts.data[0]} round scale={2} size={15} />,
          <Button
            className="Button-submitToken"
            disabled={onlyInfura}
            onClick={this.handleSubmitTokenClick}
            tooltip={onlyInfura ? 'Please install MetaMask.' : null}
            type="primary"
          >
            <FontAwesomeIcon className="Button-submitToken-icon" icon="plus" />
            Submit Token
          </Button>
        ]}
        routes={[
          { title: 'KLEROS', to: '/', extraStyle: 'NavBar-kleros' },
          {
            title: 'Token² Curated List',
            to: '/',
            extraStyle: 'NavBar-route-title'
          }
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
          <Route component={ConnectedNavBar} exact path="*" />
          <div id="scroll-root">
            <Switch>
              <Redirect exact from="/" to="/tokens/1" />
              <Route component={Tokens} exact path="/tokens/:page" />
              <Route component={TokenDetails} exact path="/token/:tokenID" />
              <Route
                component={BadgeDetails}
                exact
                path="/token/:tokenID/badge/:badgeAddr"
              />
              <Route component={PageNotFound} exact path="/notifications" />
              <Route component={PageNotFound} />
            </Switch>
          </div>
          <Switch>
            <Route component={ActionModal} exact path="*" />
          </Switch>
          <Route component={GlobalComponents} exact path="*" />
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
