import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { Helmet } from 'react-helmet'
import { Provider, connect } from 'react-redux'
import { ConnectedRouter } from 'react-router-redux'
import { Switch, Route } from 'react-router-dom'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'

import Tokens from '../containers/tokens'
import TokenDetail from '../containers/token'
import PageNotFound from '../components/page-not-found'
import NavBar from '../containers/nav-bar'
import TokenModal from '../containers/token-modal'
import Identicon from '../components/identicon'
import * as modalConstants from '../constants/modal'
import * as modalActions from '../actions/modal'
import * as walletSelectors from '../reducers/wallet'
import * as notificationSelectors from '../reducers/notification'
import * as notificationActions from '../actions/notification'
import Button from '../components/button'
import NotificationBadge from '../components/notification-badge'

import Initializer from './initializer'
import GlobalComponents from './global-components'
import { onlyInfura } from './dapp-api'
import './fontawesome'

import './app.css'

class _ConnectedNavBar extends PureComponent {
  static propTypes = {
    // Redux State
    accounts: walletSelectors.accountsShape.isRequired,
    notifications: notificationSelectors.notificationsShape.isRequired,

    // Action Dispatchers
    openTokenModal: PropTypes.func.isRequired
  }

  handleSubmitTokenClick = () => {
    const { openTokenModal } = this.props
    openTokenModal(modalConstants.TOKEN_MODAL_ENUM.Submit)
  }

  handleNotificationClick = () => {
    // TODO
  }

  render() {
    const { accounts, notifications } = this.props
    return (
      <NavBar
        routes={[
          { title: 'KLEROS', to: '/', extraStyle: 'NavBar-kleros' },
          { title: 'Token² Curated List', extraStyle: 'NavBar-route-title' }
        ]}
        extras={[
          <NotificationBadge
            key="1"
            notifications={notifications}
            onNotificationClick={this.handleNotificationClick}
          >
            <FontAwesomeIcon icon="bell" color="white" />
          </NotificationBadge>,
          <FontAwesomeIcon icon="envelope" color="white" />,
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

const ConnectedNavBar = connect(
  state => ({
    accounts: state.wallet.accounts,
    notifications: state.notification.notifications
  }),
  {
    deleteNotification: notificationActions.deleteNotification,
    openTokenModal: modalActions.openTokenModal
  }
)(_ConnectedNavBar)

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
              <Route exact path="/:tokenID" component={TokenDetail} />
              <Route component={PageNotFound} />
            </Switch>
          </div>
          <Switch>
            <Route exact path="*" component={TokenModal} />
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
