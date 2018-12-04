import PropTypes from 'prop-types'
import createReducer from 'lessdux'

import * as modalActions from '../actions/modal'
import * as modalConstants from '../constants/modal'

// Shapes
const openTokenModalShape = PropTypes.oneOf(
  modalConstants.TOKEN_MODAL_ENUM.indexes
)
const openNotificationModalShape = PropTypes.oneOf(
  modalConstants.NOTIFICATION_MODAL_ENUM.indexes
)
export { openTokenModalShape, openNotificationModalShape }

// Reducer
export default createReducer(
  {
    openTokenModal: null,
    openNotificationModal: null
  },
  {
    [modalActions.OPEN_TOKEN_MODAL]: (state, { payload: { tokenModal } }) => ({
      ...state,
      openTokenModal: tokenModal
    }),
    [modalActions.CLOSE_TOKEN_MODAL]: state => ({
      ...state,
      openTokenModal: null
    }),
    [modalActions.OPEN_NOTIFICATION_MODAL]: (
      state,
      { payload: { notificationModal } }
    ) => ({
      ...state,
      openNotificationModal: notificationModal
    }),
    [modalActions.CLOSE_NOTIFICATION_MODAL]: state => ({
      ...state,
      openNotificationModal: null
    })
  }
)
