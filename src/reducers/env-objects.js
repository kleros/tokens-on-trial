import PropTypes from 'prop-types'
import createReducer, { createResource } from 'lessdux'

import * as envObjectActions from '../actions/env-objects'

// Shapes
const {
  shape: envObjectsShape,
  initialState: envObjectsInitialState
} = createResource(
  PropTypes.shape({
    arbitrableTokenList: PropTypes.shape({}),
    arbitrableAddressList: PropTypes.shape({}),
    arbitrator: PropTypes.shape({}),
    arbitrableTokenListView: PropTypes.shape({}),
    arbitrableAddressListView: PropTypes.shape({}),
    arbitratorView: PropTypes.shape({}),
    arbitrableTokenListEvents: PropTypes.shape({}),
    arbitrableAddressListEvents: PropTypes.shape({}),
    arbitratorEvents: PropTypes.shape({})
  })
)

export { envObjectsShape }

// Reducer
export default createReducer(envObjectsInitialState, {
  [envObjectActions.SET_ENV_OBJECTS]: (_, action) => ({
    data: action.payload.data
  })
})

export const getEnvObjects = state =>
  state.envObjects.data && state.envObjects.data
