import { createActions } from 'lessdux'

/* Actions */
export const badges = createActions('BADGES')

// Badge
export const badge = {
  ...createActions('BADGE', {
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

export const createBadge = ({ tokenData, file, fileData, value }) => ({
  type: badge.CREATE,
  payload: { token: tokenData, file, fileData, value }
})
export const clearBadge = ({ tokenData, value }) => ({
  type: badge.CLEAR,
  payload: { token: tokenData, value }
})
export const fundBadgeDispute = ({ addr, value, side }) => ({
  type: badge.FUND_DISPUTE,
  payload: { addr, value, side }
})
export const challengeBadgeRequest = ({ addr, value }) => ({
  type: badge.CHALLENGE_REQUEST,
  payload: { addr, value }
})
export const fetchBadges = (
  cursor,
  count,
  filterValue,
  sortValue,
  requestedPage
) => ({
  type: badges.FETCH,
  payload: { cursor, count, filterValue, sortValue, requestedPage }
})
export const badgeTimeout = tokenData => ({
  type: badge.EXECUTE,
  payload: { token: tokenData }
})
export const fetchBadge = addr => ({
  type: badge.FETCH,
  payload: { addr }
})
export const fundBadgeAppeal = (addr, side, value) => ({
  type: badge.FUND_APPEAL,
  payload: { addr, side, value }
})
export const feesTimeoutBadge = tokenData => ({
  type: badge.FEES_TIMEOUT,
  payload: { token: tokenData }
})
export const resubmitBadge = ({ tokenData }) => ({
  type: badge.RESUBMIT,
  payload: { token: tokenData }
})
