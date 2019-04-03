export const CACHE_TOKENS = 'CACHE_TOKENS'
export const FETCH_TOKENS_CACHE = 'FETCH_TOKENS_CACHE'
export const FETCH_TOKENS_FAILED = 'FETCH_TOKENS_FAILED'
export const LOAD_TOKENS_STATE = 'LOAD_TOKENS_STATE'

export const fetchTokens = () => ({
  type: FETCH_TOKENS_CACHE
})

export const fetchTokensFailed = () => ({
  type: FETCH_TOKENS_FAILED
})

export const cacheTokens = tokens => ({
  type: CACHE_TOKENS,
  payload: { tokens }
})

export const loadState = data => ({
  type: LOAD_TOKENS_STATE,
  payload: data
})
