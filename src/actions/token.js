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
  CHALLENGE: 'CHALLENGE'
}

/* Action Creators */

// Token
export const createToken = ({ tokenData, metaEvidence }) => ({
  type: token.CREATE,
  payload: { token: tokenData, metaEvidence }
})
export const clearToken = ({ ID, metaEvidence }) => ({
  type: token.CLEAR,
  payload: { ID, metaEvidence }
})
export const challengeRequest = agreementID => ({
  type: token.CHALLENGE,
  payload: { agreementID }
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
