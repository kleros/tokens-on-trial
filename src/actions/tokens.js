export const CACHE_TOKENS = 'CACHE_TOKENS'

export const cacheTokens = ({ tokens }) => ({
  type: CACHE_TOKENS,
  payload: { tokens }
})
