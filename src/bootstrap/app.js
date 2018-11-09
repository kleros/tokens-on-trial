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
import * as modalConstants from '../constants/modal'
import * as modalActions from '../actions/modal'
import Button from '../components/button'

import Initializer from './initializer'
import GlobalComponents from './global-components'
import { isInfura } from './dapp-api'
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
        routes={[{ title: 'KLEROS', to: '/' }]}
        extras={[
          <Button
            tooltip={isInfura ? 'Please install MetaMask.' : null}
            onClick={this.handleSubmitTokenClick}
            type="primary"
            disabled={isInfura}
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
    accounts: state.wallet.accounts
  }),
  {
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
