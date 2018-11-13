import * as tokenConstants from '../constants/token'

/**
 * Creates a default filter for the client.
 * @returns {object} - The filter.
 */
export const defaultFilter = () => {
  const filter = tokenConstants.FILTER_OPTIONS_ENUM.values.reduce(
    (acc, curr) => ({
      ...acc,
      [curr]: true
    }),
    {}
  )
  return filter
}

/**
 * Creates a JS enum.
 * @param {object} filter - The filter object.
 * @returns {bool[]} A filter array to be passed as argument to the contract's queryItems() method.
 */
export const filterToContractParam = filter => {
  const filterValues = new Array(13).fill(false)

  if (filter['Registered']) filterValues[1] = true
  if (filter['Cleared']) filterValues[2] = true
  if (filter['Registration Requests']) {
    filterValues[3] = true
    filterValues[4] = true
  }
  if (filter['Clearing Requests']) {
    filterValues[5] = true
    filterValues[6] = true
  }
  if (filter['Challenged Registration Requests']) {
    filterValues[7] = true
    filterValues[8] = true
  }
  if (filter['Challenged Clearing Requests']) {
    filterValues[9] = true
    filterValues[10] = true
  }
  if (filter['My Submissions']) filterValues[11] = true
  if (filter['My Challenges']) filterValues[12] = true

  return filterValues
}
