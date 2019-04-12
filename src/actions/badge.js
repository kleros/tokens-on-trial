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
export const createBadge = ({ badgeContractAddr, tokenAddr, value }) => ({
  type: badge.CREATE,
  payload: { badgeContractAddr, tokenAddr, value }
})
export const clearBadge = ({ badgeContractAddr, tokenAddr, value }) => ({
  type: badge.CLEAR,
  payload: { badgeContractAddr, tokenAddr, value }
})
export const fundDispute = ({ tokenAddr, badgeContractAddr, value, side }) => ({
  type: badge.FUND_DISPUTE,
  payload: { tokenAddr, badgeContractAddr, value, side }
})
export const challengeRequest = ({
  tokenAddr,
  badgeContractAddr,
  value,
  evidence
}) => ({
  type: badge.CHALLENGE_REQUEST,
  payload: { tokenAddr, badgeContractAddr, value, evidence }
})
export const timeout = ({ badgeContractAddr, tokenAddr }) => ({
  type: badge.EXECUTE,
  payload: { badgeContractAddr, tokenAddr }
})
export const fetchBadge = (tokenAddress, badgeContractAddr) => ({
  type: badge.FETCH,
  payload: { tokenAddress, badgeContractAddr }
})
export const fundAppeal = (tokenAddr, badgeContractAddr, side, value) => ({
  type: badge.FUND_APPEAL,
  payload: { tokenAddr, badgeContractAddr, side, value }
})
export const feesTimeout = badgeData => ({
  type: badge.FEES_TIMEOUT,
  payload: { badge: badgeData }
})
export const resubmitBadge = ({ badgeData, value }) => ({
  type: badge.RESUBMIT,
  payload: { badge: badgeData, value }
})
export const withdrawBadgeFunds = ({ tokenAddr, badgeContractAddr, item }) => ({
  type: badge.WITHDRAW_FUNDS,
  payload: { tokenAddr, badgeContractAddr, item }
})
