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
  FEES_TIMEOUT: 'FEES_TIMEOUT',
  CHALLENGE_REQUEST: 'CHALLENGE_REQUEST'
}

/* Action Creators */

export const createToken = ({ tokenData, file, fileData, value }) => ({
  type: token.CREATE,
  payload: { token: tokenData, file, fileData, value }
})
export const clearToken = ({ tokenData, value }) => ({
  type: token.CLEAR,
  payload: { token: tokenData, value }
})
export const fundDispute = ({ ID, value, side }) => ({
  type: token.FUND_DISPUTE,
  payload: { ID, value, side }
})
export const challengeRequest = ({ ID, value }) => ({
  type: token.CHALLENGE_REQUEST,
  payload: { ID, value }
})
export const fetchTokens = (
  cursor,
  count,
  filterValue,
  sortValue,
  requestedPage
) => ({
  type: tokens.FETCH,
  payload: { cursor, count, filterValue, sortValue, requestedPage }
})
export const timeout = ID => ({
  type: token.EXECUTE,
  payload: { ID }
})
export const fetchToken = ID => ({
  type: token.FETCH,
  payload: { ID }
})
export const fundAppeal = (ID, side, value) => ({
  type: token.FUND_APPEAL,
  payload: { ID, side, value }
})
export const feesTimeout = tokenData => ({
  type: token.FEES_TIMEOUT,
  payload: { token: tokenData }
})
export const resubmitToken = ({ tokenData, value }) => ({
  type: token.RESUBMIT,
  payload: { token: tokenData, value }
})
