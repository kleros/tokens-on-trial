import React from 'react'
import PropTypes from 'prop-types'
import { Helmet } from 'react-helmet'
import { Provider, connect } from 'react-redux'
import { ConnectedRouter } from 'react-router-redux'
import { Switch, Route } from 'react-router-dom'

import Tokens from '../containers/tokens'
import TokenDetail from '../containers/token'
import PageNotFound from '../components/page-not-found'
import NavBar from '../components/nav-bar'
import TokenModal from '../containers/token-modal'

import Initializer from './initializer'
import GlobalComponents from './global-components'
import './fontawesome'

import './app.css'

const _ConnectedNavBar = () => (
  <NavBar routes={[{ title: 'KLEROS', to: '/' }]} extras={[<div />]} />
)

const ConnectedNavBar = connect(state => ({
  accounts: state.wallet.accounts
}))(_ConnectedNavBar)

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
