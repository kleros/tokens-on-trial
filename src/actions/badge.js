import { createActions } from 'lessdux'

/* Actions */
export const badges = createActions('BADGES')

// Badge
export const badge = {
  ...createActions('BADGE', {
    withCreate: true,
    withUpdate: true
  }),
  CLEAR: 'BADGE_CLEAR',
  EXECUTE: 'BADGE_EXECUTE',
  FUND_DISPUTE: 'BADGE_FUND_DISPUTE',
  RESUBMIT: 'BADGE_RESUBMIT',
  STATUS_CHANGE: 'BADGE_STATUS_CHANGE',
  FUND_APPEAL: 'BADGE_FUND_APPEAL',
  FEES_TIMEOUT: 'BADGE_FEES_TIMEOUT',
  CHALLENGE_REQUEST: 'BADGE_CHALLENGE_REQUEST',
  WITHDRAW_FUNDS: 'BADGE_WITHDRAW_FUNDS'
}

/* Badge TCR Action Creators */
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
export const createBadge = ({ badgeData, value }) => ({
  type: badge.CREATE,
  payload: { badge: badgeData, value }
})
export const clearBadge = ({ badgeData, value }) => ({
  type: badge.CLEAR,
  payload: { badge: badgeData, value }
})
export const fundDispute = ({ addr, value, side }) => ({
  type: badge.FUND_DISPUTE,
  payload: { addr, value, side }
})
export const challengeRequest = ({ addr, value, evidence }) => ({
  type: badge.CHALLENGE_REQUEST,
  payload: { addr, value, evidence }
})
export const timeout = addr => ({
  type: badge.EXECUTE,
  payload: { addr }
})
export const fetchBadge = addr => ({
  type: badge.FETCH,
  payload: { addr }
})
export const fundAppeal = (addr, side, value) => ({
  type: badge.FUND_APPEAL,
  payload: { addr, side, value }
})
export const feesTimeout = badgeData => ({
  type: badge.FEES_TIMEOUT,
  payload: { badge: badgeData }
})
export const resubmitBadge = ({ badgeData, value }) => ({
  type: badge.RESUBMIT,
  payload: { badge: badgeData, value }
})
export const withdrawBadgeFunds = ({ address, item }) => ({
  type: badge.WITHDRAW_FUNDS,
  payload: { address, item }
})
