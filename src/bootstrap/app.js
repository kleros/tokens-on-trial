import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { Helmet } from 'react-helmet'
import { Provider, connect } from 'react-redux'
import { ConnectedRouter } from 'react-router-redux'
import { Switch, Route } from 'react-router-dom'

import * as tokenActions from '../actions/token'
import * as modalActions from '../actions/modal'
import * as modalConstants from '../constants/modal'
import TokenModal from '../containers/token-modal'
import Tokens from '../containers/tokens'
import HowItWorks from '../containers/how-it-works'
import PageNotFound from '../components/page-not-found'
import NavBar from '../components/nav-bar'
import Button from '../components/button'
import klerosLogo from '../assets/images/kleros-logo.png'

import { isInfura } from './dapp-api'
import Initializer from './initializer'
import GlobalComponents from './global-components'
import './fontawesome'

import './app.css'

class _ConnectedNavBar extends PureComponent {
  static propTypes = {
    // Action Dispatchers
    openTokenModal: PropTypes.func.isRequired
  }

  handleSubmitTokenClick = () => {
    const { openTokenModal } = this.props
    openTokenModal(modalConstants.TOKEN_MODAL_ENUM.Submit)
  }

  render() {
    return (
      <NavBar
        routes={[
          { title: 'Tokens', to: '/' },
          { title: 'How it Works', to: '/how-it-works' },
          {
            title: 'Twitterverse',
            to: 'https://twitter.com/hashtag/TokensOnTrial?src=hash',
            isExternal: true
          },
          {
            title: (
              <span>
                Jurors{' '}
                <img
                  src={klerosLogo}
                  alt="Kleros Logo"
                  className="klerosLogo"
                  data-tip="Powered by Kleros"
                />
              </span>
            ),
            to: 'https://juror.kleros.io',
            isExternal: true
          }
        ]}
        extras={[
          <Button
            key="0"
            tooltip={isInfura ? 'Please install MetaMask.' : null}
            onClick={this.handleSubmitTokenClick}
            type="ternary"
            size="small"
            disabled={isInfura}
          >
            Submit Token
          </Button>
        ]}
      />
    )
  }
}
const ConnectedNavBar = connect(
  state => ({
    accounts: state.wallet.accounts
  }),
  {
    fetchToken: tokenActions.fetchToken,
    openTokenModal: modalActions.openTokenModal
  }
)(_ConnectedNavBar)

const App = ({ store, history, testElement }) => (
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
              <Route exact path="/how-it-works" component={HowItWorks} />
              <Route component={PageNotFound} />
            </Switch>
          </div>
          {testElement}
          <Switch>
            <Route exact path="/settings" component={null} />
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
  history: PropTypes.shape({}).isRequired,

  // Testing
  testElement: PropTypes.element
}

App.defaultProps = {
  // Testing
  testElement: null
}

export default App
