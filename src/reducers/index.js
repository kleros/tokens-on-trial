import { combineReducers } from 'redux'
import { routerReducer as router } from 'react-router-redux'
import { reducer as form } from 'redux-form'

import wallet from './wallet'
import arbitrableTokenList from './arbitrable-token-list'
import notification from './notification'
import arbitrator from './arbitrator'
import token from './token'
import modal from './modal'
import filter from './filter'

// Export root reducer
export default combineReducers({
  router,
  form,
  wallet,
  notification,
  arbitrableTokenList,
  arbitrator,
  token,
  modal,
  filter
})
