/* Actions */
export const SET_OLDEST_FIRST = 'SET_OLDEST_FIRST'
export const TOGGLE_FILTER = 'TOGGLE_FILTER'
export const TOGGLE_BADGE_FILTER = 'TOGGLE_BADGE_FILTER'
export const LOAD_FILTERS_STATE = 'LOAD_FILTERS_STATE'

/* Action Creators */
export const setOldestFirst = (oldestFirst, tcr) => ({
  type: SET_OLDEST_FIRST,
  payload: { oldestFirst, tcr }
})
export const toggleFilter = (key, tcr) => ({
  type: TOGGLE_FILTER,
  payload: { key, tcr }
})
export const toggleBadgeFilter = (key, tcr) => ({
  type: TOGGLE_BADGE_FILTER,
  payload: { key, tcr }
})
export const loadState = data => ({
  type: LOAD_FILTERS_STATE,
  payload: { data }
})
