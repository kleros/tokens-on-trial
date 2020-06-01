import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Helmet } from 'react-helmet'
import { Provider, connect } from 'react-redux'
import { ConnectedRouter } from 'react-router-redux'
import { Redirect, Route, Switch, withRouter } from 'react-router-dom'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import { BeatLoader } from 'react-spinners'
import { Footer } from '@kleros/react-components/dist'

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
import * as walletSelectors from '../reducers/wallet'
import * as notificationSelectors from '../reducers/notification'
import * as notificationActions from '../actions/notification'
import { arbitrableAddressListDataShape } from '../reducers/arbitrable-address-list'
import Button from '../components/button'
import NotificationBadge from '../components/notification-badge'
import SettingsModal from '../components/settings-modal'
import TelegramButton from '../components/telegram-button'

import Initializer from './initializer'
import GlobalComponents from './global-components'
import { onlyInfura, IPFS_URL } from './dapp-api'

import './fontawesome'
import './app.css'

const ETHFINEX_BADGE = {
  1: '0x916deaB80DFbc7030277047cD18B233B3CE5b4Ab',
  42: '0xd58BDd286E8155b6223e2A62932AE3e0A9A75759'
}

class _ConnectedNavBar extends Component {
  static propTypes = {
    // Navigation
    history: PropTypes.shape({
      push: PropTypes.func.isRequired
    }).isRequired,

    // Redux State
    accounts: walletSelectors.accountsShape.isRequired,
    notifications: notificationSelectors.notificationsShape.isRequired,
    arbitrableAddressListData: arbitrableAddressListDataShape.isRequired,

    // Action Dispatchers
    openActionModal: PropTypes.func.isRequired,
    deleteNotification: PropTypes.func.isRequired,
    closeNotificationsModal: PropTypes.func.isRequired
  }

  handleSubmitTokenClick = () => {
    const { openActionModal } = this.props
    openActionModal(modalConstants.ACTION_MODAL_ENUM.Submit)
  }

  handleNotificationClick = ({ ID, address, badgeAddr }) => {
    const { deleteNotification, history, closeNotificationsModal } = this.props
    if (!badgeAddr) {
      deleteNotification(ID)
      history.push(`/token/${ID}`)
    } else {
      deleteNotification(address)
      history.push(`/badge/${badgeAddr}/${address}`)
    }
    closeNotificationsModal()
  }

  handleShowAllClick = () => {
    const { history, closeNotificationsModal } = this.props
    closeNotificationsModal()
    history.push(`/notifications`)
  }

  render() {
    const { accounts, notifications, arbitrableAddressListData } = this.props

    let badgeContracts
    if (arbitrableAddressListData)
      badgeContracts = Object.keys(arbitrableAddressListData)
        .filter(
          (
            badgeContractAddr // Ethfinex badge is halted.
          ) =>
            badgeContractAddr !== ETHFINEX_BADGE[42] &&
            badgeContractAddr !== ETHFINEX_BADGE[1]
        )
        .map(badgeContractAddr => arbitrableAddressListData[badgeContractAddr])
        .filter(badgeContract => badgeContract.variables)

    const submenus = [
      {
        title: 'Guides',
        key: 'Guides',
        extraStyle: 'NavBar-route-title',
        routes: [
          {
            title: 'T²CR Guide',
            to: 'https://blog.kleros.io/kleros-ethfinex-tcr-an-explainer/',
            extraStyle: 'NavBar-route-title'
          },
          {
            title: 'Ethfinex Badge',
            to: 'https://blog.kleros.io/the-ethfinex-listing-guide/',
            extraStyle: 'NavBar-route-title'
          },
          {
            title: 'Appeal Fees Crowdfunding',
            to:
              'https://blog.kleros.io/kleros-decentralized-token-listing-appeal-fees/',
            extraStyle: 'NavBar-route-title'
          }
        ]
      },
      {
        title: badgeContracts ? (
          'Criteria'
        ) : (
          <BeatLoader color="white" size={5} />
        ),
        key: 'Criteria',
        extraStyle: 'NavBar-route-title',
        routes: badgeContracts
          ? badgeContracts.map(badgeContract => ({
              title: badgeContract.variables.title,
              to: `${IPFS_URL}${badgeContract.fileURI}`,
              extraStyle: 'NavBar-route-title'
            }))
          : []
      },
      {
        title: 'Integrations',
        key: 'Integrations',
        extraStyle: 'NavBar-route-title',
        routes: [
          {
            title: 'uniswap.ninja',
            to: 'https://uniswap.ninja/',
            extraStyle: 'NavBar-route-title'
          },
          {
            title: 'Fairdex/Slow.Trade',
            to: 'https://fairdex.net/',
            extraStyle: 'NavBar-route-title'
          },
          {
            title: 'Escrow',
            to: 'https://escrow.kleros.io/',
            extraStyle: 'NavBar-route-title'
          },
          {
            title: 'Ethfinex(Diversifi)',
            to: 'https://blog.kleros.io/the-ethfinex-listing-guide/',
            extraStyle: 'NavBar-route-title'
          }
        ]
      }
    ]

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
          !onlyInfura && (
            <Identicon address={accounts.data[0]} round scale={2} size={15} />
          )
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
            title: 'Badges',
            to: '/badges',
            extraStyle: 'NavBar-route-title'
          },
          {
            title: 'Statistics',
            to: 'https://t2cr-dashboard.kleros.io',
            extraStyle: 'NavBar-route-title',
            isExternal: true
          }
        ]}
        submenus={submenus}
      />
    )
  }
}

const ConnectedNavBar = withRouter(
  connect(
    state => ({
      accounts: state.wallet.accounts,
      notifications: state.notification.notifications,
      isNotificationsModalOpen: state.modal.isNotificationsModalOpen,
      arbitrableAddressListData:
        state.arbitrableAddressList.arbitrableAddressListData.data
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
        <>
          <Helmet>
            <title>Kleros · Tokens² Curated List</title>
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
                <div className="FooterWrapper">
                  <Footer name="Kleros · T²CR" />
                </div>
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
