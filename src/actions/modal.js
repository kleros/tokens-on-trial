/* Actions */

// Token Modal
export const OPEN_TOKEN_MODAL = 'OPEN_TOKEN_MODAL'
export const CLOSE_TOKEN_MODAL = 'CLOSE_TOKEN_MODAL'

// Notification Modal
export const OPEN_NOTIFICATIONS_MODAL = 'OPEN_NOTIFICATIONS_MODAL'
export const CLOSE_NOTIFICATIONS_MODAL = 'CLOSE_NOTIFICATIONS_MODAL'

// Settings Modal
export const OPEN_SETTINGS_MODAL = 'OPEN_SETTINGS_MODAL'
export const CLOSE_SETTINGS_MODAL = 'CLOSE_SETTINGS_MODAL'

/* Action Creators */

// Token Modal
export const openTokenModal = tokenModal => ({
  type: OPEN_TOKEN_MODAL,
  payload: { tokenModal }
})
export const closeTokenModal = () => ({ type: CLOSE_TOKEN_MODAL })

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
