import { combineReducers } from 'redux'
import { routerReducer as router } from 'react-router-redux'
import { reducer as form } from 'redux-form'

import wallet from './wallet'
import arbitrableTokenList from './arbitrable-token-list'
import token from './token'
import modal from './modal'

// Export root reducer
export default combineReducers({
  router,
  form,
  wallet,
  arbitrableTokenList,
  token,
  modal
})
