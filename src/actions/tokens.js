export const ADD_TOKENS = 'ADD_TOKENS'

export const addTokens = ({ tokens, blockNumber }) => ({
  type: ADD_TOKENS,
  payload: { tokens, blockNumber }
})
