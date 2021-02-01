import PropTypes from 'prop-types'
import createReducer from 'lessdux'
import * as modalActions from '../actions/modal'
import * as modalConstants from '../constants/modal'

// Shapes
const openActionModalShape = PropTypes.oneOf(
  modalConstants.ACTION_MODAL_ENUM.indexes
)
export { openActionModalShape }

// Reducer
export default createReducer(
  {
    openActionModal: null,
    isNotificationsModalOpen: false,
    isSettingsModalOpen: false,
  },
  {
    [modalActions.OPEN_ACTION_MODAL]: (
      state,
      { payload: { actionModal, param } }
    ) => ({
      ...state,
      openActionModal: actionModal,
      actionModalParam: param,
    }),
    [modalActions.CLOSE_ACTION_MODAL]: (state) => ({
      ...state,
      openActionModal: null,
      actionModalParam: null,
    }),
    [modalActions.OPEN_NOTIFICATIONS_MODAL]: (state) => ({
      ...state,
      isNotificationsModalOpen: true,
    }),
    [modalActions.CLOSE_NOTIFICATIONS_MODAL]: (state) => ({
      ...state,
      isNotificationsModalOpen: false,
    }),
    [modalActions.OPEN_SETTINGS_MODAL]: (state) => ({
      ...state,
      isSettingsModalOpen: true,
    }),
    [modalActions.CLOSE_SETTINGS_MODAL]: (state) => ({
      ...state,
      isSettingsModalOpen: false,
    }),
  }
)
