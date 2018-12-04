/* Actions */

// Token Modal
export const OPEN_TOKEN_MODAL = 'OPEN_TOKEN_MODAL'
export const CLOSE_TOKEN_MODAL = 'CLOSE_TOKEN_MODAL'

// Notification Modal
export const OPEN_NOTIFICATION_MODAL = 'OPEN_NOTIFICATION_MODAL'
export const CLOSE_NOTIFICATION_MODAL = 'CLOSE_NOTIFICATION_MODAL'

/* Action Creators */

// Token Modal
export const openTokenModal = tokenModal => ({
  type: OPEN_TOKEN_MODAL,
  payload: { tokenModal }
})
export const closeTokenModal = () => ({ type: CLOSE_TOKEN_MODAL })

// Notification Modal
export const openNotificationModal = notificationModal => ({
  type: OPEN_NOTIFICATION_MODAL,
  payload: { notificationModal }
})
export const closeNotificationModal = () => ({ type: CLOSE_NOTIFICATION_MODAL })
