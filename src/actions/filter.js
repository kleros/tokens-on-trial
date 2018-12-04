/* Actions */
export const SET_OLDEST_FIRST = 'SET_OLDEST_FIRST'
export const TOGGLE_FILTER = 'TOGGLE_FILTER'

/* Action Creators */
export const setOldestFirst = oldestFirst => ({
  type: SET_OLDEST_FIRST,
  payload: { oldestFirst }
})
export const toggleFilter = key => ({
  type: TOGGLE_FILTER,
  payload: { key }
})
