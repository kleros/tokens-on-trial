import PropTypes from 'prop-types'
import createReducer from 'lessdux'

import * as modalActions from '../actions/modal'
import * as modalConstants from '../constants/modal'

// Shapes
const openTokenModalShape = PropTypes.oneOf(
  modalConstants.TOKEN_MODAL_ENUM.indexes
)
export { openTokenModalShape }

// Reducer
export default createReducer(
  {
    openTokenModal: null
  },
  {
    [modalActions.OPEN_TOKEN_MODAL]: (state, { payload: { tokenModal } }) => ({
      ...state,
      openTokenModal: tokenModal
    }),
    [modalActions.CLOSE_TOKEN_MODAL]: state => ({
      ...state,
      openTokenModal: null
    })
  }
)
