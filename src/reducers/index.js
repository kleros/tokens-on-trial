import { combineReducers } from 'redux'
import { routerReducer as router } from 'react-router-redux'
import { reducer as form } from 'redux-form'

import wallet from './wallet'
import arbitrableTokenList from './arbitrable-token-list'
import arbitrableAddressList from './arbitrable-address-list'
import notification from './notification'
import arbitrator from './arbitrator'
import token from './token'
import badge from './badge'
import modal from './modal'
import filter from './filter'
import tokens from './tokens'
import badges from './badges'
import envObjects from './env-objects'

// Export root reducer
export default combineReducers({
  router,
  form,
  wallet,
  notification,
  arbitrableTokenList,
  arbitrableAddressList,
  arbitrator,
  token,
  badge,
  modal,
  filter,
  tokens,
  badges,
  envObjects
})
