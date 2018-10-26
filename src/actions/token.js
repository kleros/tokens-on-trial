import { createActions } from 'lessdux'

/* Actions */

// Tokens
export const tokens = createActions('TOKENS')

// Token
export const token = {
  ...createActions('TOKEN', {
    withCreate: true,
    withUpdate: true
  }),
  EXECUTE_REQUEST: 'EXECUTE_TOKEN_REQUEST',
  CHALLENGE_REQUEST: 'CHALLENGE_REQUEST',
  APPEAL_RULING: 'APPEAL_TOKEN_RULING',
  EXECUTE_RULING: 'EXECUTE_TOKEN_RULING'
}

/* Action Creators */

// Tokens
export const fetchTokens = (cursor, count, filterValue, sortValue) => ({
  type: tokens.FETCH,
  payload: { cursor, count, filterValue, sortValue }
})

// Token
export const createToken = imageFileDataURL => ({
  type: token.CREATE,
  payload: { imageFileDataURL }
})
export const fetchToken = (ID, withDisputeData) => ({
  type: token.FETCH,
  payload: { ID, withDisputeData }
})
export const executeTokenRequest = ID => ({
  type: token.EXECUTE_REQUEST,
  payload: { ID }
})
export const submitTokenChallenge = ID => ({
  type: token.SUBMIT_CHALLENGE,
  payload: { ID }
})
export const appealTokenRuling = ID => ({
  type: token.APPEAL_RULING,
  payload: { ID }
})
export const executeTokenRuling = ID => ({
  type: token.EXECUTE_RULING,
  payload: { ID }
})
