import * as filterConstants from '../constants/filter'

/**
 * Creates a default filter for the client.
 * @returns {object} - The filter.
 */
export const defaultFilter = () => {
  const filter = filterConstants.FILTER_OPTIONS_ENUM.values.reduce(
    (acc, curr) => ({
      ...acc,
      [curr]: true
    }),
    {}
  )
  filter['Absent'] = false

  return filter
}

/**
 * Creates a JS enum.
 * @param {object} filter - The filter object.
 * @returns {bool[]} A filter array to be passed as argument to the contract's queryItems() method.
 */
export const filterToContractParam = filter => {
  const filterValues = new Array(8).fill(false)

  if (filter['Absent']) filterValues[0] = true
  if (filter['Registered']) filterValues[1] = true
  if (filter['Registration Requests']) filterValues[2] = true
  if (filter['Clearing Requests']) filterValues[3] = true
  if (filter['Challenged Registration Requests']) filterValues[4] = true
  if (filter['Challenged Clearing Requests']) filterValues[5] = true
  if (filter['My Submissions']) filterValues[6] = true
  if (filter['My Challenges']) filterValues[7] = true
  return filterValues
}

/**
 * Returns the number of tokens selected by the filter
 * @param {object} countByStatus - The number of items with each status.
 * @param {object} filters - The filter selected
 * @returns {number} - The total number of tokens.
 */
export const totalByStatus = (countByStatus, filters) => {
  let total = 0
  const {
    absent,
    registered,
    registrationRequest,
    clearingRequest,
    challengedRegistrationRequest,
    challengedClearingRequest
  } = countByStatus

  if (filters.Absent) total += absent
  if (filters['Registered']) total += registered
  if (filters['Registration Requests']) total += registrationRequest
  if (filters['Clearing Requests']) total += clearingRequest
  if (filters['Challenged Registration Requests'])
    total += challengedRegistrationRequest
  if (filters['Challenged Clearing Requests'])
    total += challengedClearingRequest

  return total
}
