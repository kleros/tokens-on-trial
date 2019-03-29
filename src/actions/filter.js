/* Actions */
export const SET_OLDEST_FIRST = 'SET_OLDEST_FIRST'
export const TOGGLE_FILTER = 'TOGGLE_FILTER'
export const LOAD_FILTERS_STATE = 'LOAD_FILTERS_STATE'

/* Action Creators */
export const setOldestFirst = oldestFirst => ({
  type: SET_OLDEST_FIRST,
  payload: { oldestFirst }
})
export const toggleFilter = key => ({
  type: TOGGLE_FILTER,
  payload: { key }
})
export const loadState = data => ({
  type: LOAD_FILTERS_STATE,
  payload: data
})
