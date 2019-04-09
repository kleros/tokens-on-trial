import PropTypes from 'prop-types'
import createReducer from 'lessdux'

import * as filterActions from '../actions/filter'
import * as filterConstants from '../constants/filter'
import { defaultFilter } from '../utils/filter'
import { APP_VERSION } from '../bootstrap/dapp-api'

// Shapes
const filterShape = PropTypes.shape({
  oldestFirst: PropTypes.oneOf(filterConstants.SORT_OPTIONS_ENUM.indexes),
  filters: PropTypes.shape({
    Registered: PropTypes.bool.isRequired,
    'Registration Requests': PropTypes.bool.isRequired,
    'Challenged Registration Requests': PropTypes.bool.isRequired,
    Absent: PropTypes.bool.isRequired,
    'Clearing Requests': PropTypes.bool.isRequired,
    'Challenged Clearing Requests': PropTypes.bool.isRequired,
    'My Submissions': PropTypes.bool.isRequired,
    'My Challenges': PropTypes.bool.isRequired
  }).isRequired
})
export { filterShape }

// Reducer
export default createReducer(
  {
    oldestFirst: 0,
    filters: defaultFilter()
  },
  {
    [filterActions.SET_OLDEST_FIRST]: (
      state,
      { payload: { oldestFirst, tcr } }
    ) => {
      const newState = {
        ...state,
        oldestFirst
      }
      localStorage.setItem(
        `${tcr.options.address}filter@${APP_VERSION}`,
        JSON.stringify(newState)
      )
      return newState
    },
    [filterActions.TOGGLE_FILTER]: (state, { payload: { key, tcr } }) => {
      const newState = {
        ...state,
        filters: {
          ...state.filters,
          [key]: !state.filters[key]
        }
      }
      localStorage.setItem(
        `${tcr.options.address}filter@${APP_VERSION}`,
        JSON.stringify(newState)
      )
      return newState
    },
    [filterActions.LOAD_FILTERS_STATE]: (_, { payload: { data } }) => data
  }
)
