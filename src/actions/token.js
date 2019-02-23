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
  WITHDRAW: 'WITHDRAW',
  CREATE_BADGE: 'CREATE_BADGE',
  CHALLENGE_REQUEST: 'CHALLENGE_REQUEST',
  CLEAR_BADGE: 'CLEAR_BADGE',
  EXECUTE_BADGE: 'EXECUTE_BADGE',
  FUND_DISPUTE_BADGE: 'FUND_DISPUTE_BADGE',
  RESUBMIT_BADGE: 'RESUBMIT_BADGE',
  STATUS_CHANGE_BADGE: 'STATUS_CHANGE_BADGE',
  FUND_APPEAL_BADGE: 'FUND_APPEAL_BADGE',
  FEES_TIMEOUT_BADGE: 'FEES_TIMEOUT_BADGE',
  CHALLENGE_REQUEST_BADGE: 'CHALLENGE_REQUEST_BADGE'
}

/* T²CR Action Creators */

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
export const challengeRequest = ({ ID, value, evidence }) => ({
  type: token.CHALLENGE_REQUEST,
  payload: { ID, value, evidence }
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
export const withdrawTokenFunds = ({ ID, request }) => ({
  type: token.WITHDRAW,
  payload: { ID, request }
})

/* Badge TCR */
export const createBadge = ({ tokenData, file, fileData, value }) => ({
  type: token.CREATE_BADGE,
  payload: { token: tokenData, file, fileData, value }
})
export const clearBadge = ({ tokenData, value }) => ({
  type: token.CLEAR_BADGE,
  payload: { token: tokenData, value }
})
export const fundBadgeDispute = ({ addr, ID, side, value }) => ({
  type: token.FUND_DISPUTE_BADGE,
  payload: { addr, side, ID, value }
})
export const challengeBadgeRequest = ({ addr, value, evidence }) => ({
  type: token.CHALLENGE_REQUEST_BADGE,
  payload: { addr, value, evidence }
})
export const badgeTimeout = tokenData => ({
  type: token.EXECUTE_BADGE,
  payload: { token: tokenData }
})
export const fetchBadge = addr => ({
  type: token.FETCH_BADGE,
  payload: { addr }
})
export const fundBadgeAppeal = (addr, side, value, ID) => ({
  type: token.FUND_APPEAL_BADGE,
  payload: { addr, ID, side, value }
})
export const feesTimeoutBadge = tokenData => ({
  type: token.FEES_TIMEOUT_BADGE,
  payload: { token: tokenData }
})
export const resubmitBadge = ({ tokenData }) => ({
  type: token.RESUBMIT_BADGE,
  payload: { token: tokenData }
})
