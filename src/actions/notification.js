import { createActions } from 'lessdux'

/* Actions */

// Notifications
export const notifications = createActions('NOTIFICATIONS')
export const LOAD_NOTIFICATIONS_STATE = 'LOAD_NOTIFICATIONS_STATE'

// Notification
export const notification = createActions('NOTIFICATION', {
  withCreate: true,
  withDelete: true
})

/* Action Creators */

// Notification
export const deleteNotification = ID => ({
  type: notification.DELETE,
  payload: { ID }
})

export const loadState = data => ({
  type: LOAD_NOTIFICATIONS_STATE,
  payload: data
})
