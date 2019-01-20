/* Actions */

// Token Modal
export const OPEN_ACTION_MODAL = 'OPEN_ACTION_MODAL'
export const CLOSE_ACTION_MODAL = 'CLOSE_ACTION_MODAL'

// Notification Modal
export const OPEN_NOTIFICATIONS_MODAL = 'OPEN_NOTIFICATIONS_MODAL'
export const CLOSE_NOTIFICATIONS_MODAL = 'CLOSE_NOTIFICATIONS_MODAL'

// Settings Modal
export const OPEN_SETTINGS_MODAL = 'OPEN_SETTINGS_MODAL'
export const CLOSE_SETTINGS_MODAL = 'CLOSE_SETTINGS_MODAL'

/* Action Creators */

// Token Modal
export const openActionModal = (actionModal, param) => {
  console.info('side', param)
  return {
    type: OPEN_ACTION_MODAL,
    payload: { actionModal, param }
  }
}
export const closeActionModal = () => ({ type: CLOSE_ACTION_MODAL })

// Notification Modal
export const openNotificationsModal = () => ({
  type: OPEN_NOTIFICATIONS_MODAL
})
export const closeNotificationsModal = () => ({
  type: CLOSE_NOTIFICATIONS_MODAL
})

// Notification Modal
export const openSettingsModal = () => ({
  type: OPEN_SETTINGS_MODAL
})
export const closeSettingsModal = () => ({
  type: CLOSE_SETTINGS_MODAL
})
