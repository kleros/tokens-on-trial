/* Actions */
export const SET_OLDEST_FIRST = 'SET_OLDEST_FIRST'

/* Action Creators */
export const setOldestFirst = oldestFirst => ({
  type: SET_OLDEST_FIRST,
  payload: { oldestFirst }
})
