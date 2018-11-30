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
  FEES_TIMEOUT: 'FEES_TIMEOUT'
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
export const feesTimeout = tokenData => ({
  type: token.FEES_TIMEOUT,
  payload: { token: tokenData }
})
export const resubmitToken = ({ tokenData }) => ({
  type: token.RESUBMIT,
  payload: { token: tokenData }
})
