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
export const fundBadgeDispute = ({ ID, value, side }) => ({
  type: badge.FUND_DISPUTE,
  payload: { ID, value, side }
})
export const challengeBadgeRequest = ({ ID, value }) => ({
  type: badge.CHALLENGE_REQUEST,
  payload: { ID, value }
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
export const fetchBadge = ID => ({
  type: badge.FETCH,
  payload: { ID }
})
export const fundBadgeAppeal = (ID, side, value) => ({
  type: badge.FUND_APPEAL,
  payload: { ID, side, value }
})
export const feesTimeoutBadge = tokenData => ({
  type: badge.FEES_TIMEOUT,
  payload: { token: tokenData }
})
export const resubmitBadge = ({ tokenData }) => ({
  type: badge.RESUBMIT,
  payload: { token: tokenData }
})
