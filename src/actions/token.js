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
export const fetchTokens = (cursor, count, filterValue, sortValue) => ({
  type: tokens.FETCH,
  payload: { cursor, count, filterValue, sortValue }
})
export const fetchToken = (ID, withDisputeData) => ({
  type: token.FETCH,
  payload: { ID, withDisputeData }
})
