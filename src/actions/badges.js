export const CACHE_BADGES = 'CACHE_BADGES'
export const FETCH_BADGES_CACHE = 'FETCH_BADGES_CACHE'

export const cacheBadges = badges => ({
  type: CACHE_BADGES,
  payload: { badges }
})

export const fetchBadges = () => ({
  type: FETCH_BADGES_CACHE
})
