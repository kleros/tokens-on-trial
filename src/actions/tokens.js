export const ADD_TOKENS = 'ADD_TOKENS'

export const addTokens = ({ tokens, blockHeight }) => ({
  type: ADD_TOKENS,
  payload: { tokens, blockHeight }
})
