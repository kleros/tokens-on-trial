import PropTypes from 'prop-types'
import createReducer from 'lessdux'

import * as filterActions from '../actions/filter'
import * as filterConstants from '../constants/filter'

// Shapes
const oldestFirstShape = PropTypes.oneOf(
  filterConstants.SORT_OPTIONS_ENUM.indexes
)
export { oldestFirstShape }

// Reducer
export default createReducer(
  {
    oldestFirst: 0
  },
  {
    [filterActions.SET_OLDEST_FIRST]: (
      state,
      { payload: { oldestFirst } }
    ) => ({
      ...state,
      oldestFirst
    })
  }
)
