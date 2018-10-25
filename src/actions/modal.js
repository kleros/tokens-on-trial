/* Actions */

// Token Modal
export const OPEN_TOKEN_MODAL = 'OPEN_TOKEN_MODAL'
export const CLOSE_TOKEN_MODAL = 'CLOSE_TOKEN_MODAL'

/* Action Creators */

// Token Modal
export const openTokenModal = tokenModal => ({
  type: OPEN_TOKEN_MODAL,
  payload: { tokenModal }
})
export const closeTokenModal = () => ({ type: CLOSE_TOKEN_MODAL })
