import { createActions } from 'lessdux'

/* Actions */
export const tokens = createActions('TOKENS')

// Token
export const token = {
  ...createActions('TOKEN', {
    withCreate: true,
    withUpdate: true
  })
}

/* Action Creators */

// Token
export const createToken = tokenData => ({
  type: token.CREATE,
  payload: { token: tokenData }
})
