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
  RESUBMIT: 'RESUBMIT',
  STATUS_CHANGE: 'STATUS_CHANGE',
  FUND_APPEAL: 'FUND_APPEAL',
  FEE_TIMEOUT: 'FEE_TIMEOUT'
}

/* Action Creators */

// Token
export const requestStatusChange = ({ tokenData }) => ({
  type: token.STATUS_CHANGE,
  payload: { token: tokenData }
})
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
export const appealRuling = (ID, side) => ({
  type: token.FUND_APPEAL,
  payload: { ID, side }
})
export const feeTimeout = tokenData => ({
  type: token.FEE_TIMEOUT,
  payload: { token: tokenData }
})
