import { createActions } from 'lessdux'

/* Actions */
export const tokens = createActions('TOKENS')

// Token
export const token = {
  ...createActions('TOKEN', {
    withCreate: true,
    withUpdate: true
  }),
  CLEAR: 'CLEAR',
  EXECUTE: 'EXECUTE',
  FUND_DISPUTE: 'FUND_DISPUTE',
  RESUBMIT: 'RESUBMIT'
}

/* Action Creators */

// Token
export const createToken = ({ tokenData }) => ({
  type: token.CREATE,
  payload: { token: tokenData }
})
export const requestRegistration = ({ ID }) => ({
  type: token.RESUBMIT,
  payload: { ID }
})
export const clearToken = ({ tokenData }) => ({
  type: token.CLEAR,
  payload: { token: tokenData }
})
export const fundDispute = ({ ID, value, side }) => ({
  type: token.FUND_DISPUTE,
  payload: { ID, value, side }
})
export const fetchTokens = (cursor, count, filterValue, sortValue) => ({
  type: tokens.FETCH,
  payload: { cursor, count, filterValue, sortValue }
})
export const executeRequest = ID => ({
  type: token.EXECUTE,
  payload: { ID }
})
export const fetchToken = ID => ({
  type: token.FETCH,
  payload: { ID }
})
