import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Helmet } from 'react-helmet'
import { Provider, connect } from 'react-redux'
import { ConnectedRouter } from 'react-router-redux'
import { Redirect, Route, Switch, withRouter } from 'react-router-dom'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'

import Tokens from '../containers/tokens'
import Badges from '../containers/badges'
import TokenDetails from '../containers/token'
import BadgeDetails from '../containers/badge'
import PageNotFound from '../components/page-not-found'
import NavBar from '../containers/nav-bar'
import ActionModal from '../containers/action-modal'
import Identicon from '../components/identicon'
import * as modalConstants from '../constants/modal'
import * as modalActions from '../actions/modal'
import * as arbitrableTokenListActions from '../actions/arbitrable-token-list'
import * as arbitrableAddressListActions from '../actions/arbitrable-address-list'
import * as walletSelectors from '../reducers/wallet'
import * as notificationSelectors from '../reducers/notification'
import * as notificationActions from '../actions/notification'
import * as tokensActions from '../actions/tokens'
import * as badgesActions from '../actions/badges'
import Button from '../components/button'
import NotificationBadge from '../components/notification-badge'
import SettingsModal from '../components/settings-modal'
import TelegramButton from '../components/telegram-button'

import Initializer from './initializer'
import GlobalComponents from './global-components'
import {
  onlyInfura,
  arbitrableTokenListEvents,
  arbitrableAddressListEvents
} from './dapp-api'
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
    closeNotificationsModal: PropTypes.func.isRequired,
    fetchArbitrableTokenListData: PropTypes.func.isRequired,
    fetchArbitrableAddressListData: PropTypes.func.isRequired,
    fetchTokens: PropTypes.func.isRequired,
    fetchBadges: PropTypes.func.isRequired
  }

  handleSubmitTokenClick = () => {
    const { openActionModal } = this.props
    openActionModal(modalConstants.ACTION_MODAL_ENUM.Submit)
  }

  handleNotificationClick = ({ ID, addr, badgeAddr }) => {
    const { deleteNotification, history, closeNotificationsModal } = this.props
    if (!badgeAddr) {
      deleteNotification(ID)
      history.push(`/token/${ID}`)
    } else {
      deleteNotification(addr)
      history.push(`/badge/${badgeAddr}/${addr}`)
    }
    closeNotificationsModal()
  }

  handleShowAllClick = () => {
    const { history, closeNotificationsModal } = this.props
    closeNotificationsModal()
    history.push(`/notifications`)
  }

  componentDidMount() {
    const {
      fetchArbitrableAddressListData,
      fetchArbitrableTokenListData,
      fetchTokens,
      fetchBadges
    } = this.props
    fetchArbitrableTokenListData()
    fetchArbitrableAddressListData()
    fetchTokens()
    fetchBadges()
    arbitrableTokenListEvents.events.TokenStatusChange(() => {
      fetchTokens()
    })
    arbitrableAddressListEvents.events.AddressStatusChange(() => {
      fetchBadges()
    })
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
          <Identicon address={accounts.data[0]} round scale={2} size={15} />
        ]}
        action={
          <Button
            className={`Button-submitToken`}
            disabled={onlyInfura}
            onClick={this.handleSubmitTokenClick}
            tooltip={onlyInfura ? 'Please install MetaMask.' : null}
            type="primary"
          >
            <FontAwesomeIcon className="Button-submitToken-icon" icon="plus" />
            Submit Token
          </Button>
        }
        routes={[
          { title: 'KLEROS', to: '/', extraStyle: 'NavBar-kleros' },
          {
            title: 'Token² Curated Registry',
            subtitle: 'Beta',
            to: '/tokens',
            extraStyle: 'NavBar-route-title'
          },
          {
            title: 'Badge Requests',
            to: '/badges',
            extraStyle: 'NavBar-route-title'
          }
        ]}
        submenus={[
          {
            title: 'Guides',
            extraStyle: 'NavBar-route-title',
            routes: [
              {
                title: 'T²CR Guide',
                to: 'https://blog.kleros.io/kleros-ethfinex-tcr-an-explainer/',
                extraStyle: 'NavBar-route-title'
              },
              {
                title: 'Ethfinex Guide',
                to: 'https://blog.kleros.io/the-ethfinex-listing-guide/',
                extraStyle: 'NavBar-route-title'
              }
            ]
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
      closeNotificationsModal: modalActions.closeNotificationsModal,
      fetchArbitrableAddressListData:
        arbitrableAddressListActions.fetchArbitrableAddressListData,
      fetchArbitrableTokenListData:
        arbitrableTokenListActions.fetchArbitrableTokenListData,
      fetchTokens: tokensActions.fetchTokens,
      fetchBadges: badgesActions.fetchBadges
    }
  )(_ConnectedNavBar)
)

const App = ({ store, history }) => (
  <Provider store={store}>
    <Initializer>
      <ConnectedRouter history={history}>
        <>
          <Helmet>
            <title>Kleros · Tokens on Trial</title>
          </Helmet>
          <Switch>
            <div id="router-root">
              <Route component={ConnectedNavBar} exact path="*" />
              <div id="scroll-root">
                <Switch>
                  <Redirect exact from="/" to="/tokens" />
                  <Route component={Tokens} exact path="/tokens" />
                  <Route
                    component={TokenDetails}
                    exact
                    path="/token/:tokenID"
                  />
                  <Route component={Badges} exact path="/badges" />
                  <Route
                    component={BadgeDetails}
                    exact
                    path="/badge/:badgeAddr/:tokenAddr"
                  />
                  <Route component={PageNotFound} exact path="/notifications" />
                  <Route component={PageNotFound} />
                </Switch>
              </div>
              <Route component={ActionModal} exact path="*" />
              <Route component={GlobalComponents} exact path="*" />
            </div>
          </Switch>
          <TelegramButton />
        </>
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
