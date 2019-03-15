export const CACHE_TOKENS = 'CACHE_TOKENS'
export const FETCH_TOKENS_CACHE = 'FETCH_TOKENS_CACHE'

export const cacheTokens = tokens => ({
  type: CACHE_TOKENS,
  payload: { tokens }
})

export const fetchTokens = () => ({
  type: FETCH_TOKENS_CACHE
})
