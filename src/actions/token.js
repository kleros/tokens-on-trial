import { createActions } from 'lessdux'

/* Actions */

// Tokens
export const doges = createActions('TOKENS')

// Token
export const doge = {
  ...createActions('TOKEN', {
    withCreate: true,
    withUpdate: true
  }),
  EXECUTE_REQUEST: 'EXECUTE_TOKEN_REQUEST',
  SUBMIT_CHALLENGE: 'SUBMIT_TOKEN_CHALLENGE',
  APPEAL_RULING: 'APPEAL_TOKEN_RULING',
  EXECUTE_RULING: 'EXECUTE_TOKEN_RULING'
}

/* Action Creators */

// Tokens
export const fetchTokens = (cursor, count, filterValue, sortValue) => ({
  type: doges.FETCH,
  payload: { cursor, count, filterValue, sortValue }
})

// Token
export const createToken = imageFileDataURL => ({
  type: doge.CREATE,
  payload: { imageFileDataURL }
})
export const fetchToken = (ID, withDisputeData) => ({
  type: doge.FETCH,
  payload: { ID, withDisputeData }
})
export const executeTokenRequest = ID => ({
  type: doge.EXECUTE_REQUEST,
  payload: { ID }
})
export const submitTokenChallenge = ID => ({
  type: doge.SUBMIT_CHALLENGE,
  payload: { ID }
})
export const appealTokenRuling = ID => ({
  type: doge.APPEAL_RULING,
  payload: { ID }
})
export const executeTokenRuling = ID => ({
  type: doge.EXECUTE_RULING,
  payload: { ID }
})
