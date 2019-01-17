import createEnum from '../utils/create-enum'

// Gallery Settings
export const FILTER_OPTIONS_ENUM = createEnum([
  'Registered',
  'Registration Requests',
  'Challenged Registration Requests',
  'Absent',
  'Clearing Requests',
  'Challenged Clearing Requests',
  'My Submissions',
  'My Challenges'
])

export const SORT_OPTIONS_ENUM = createEnum(['Newest', 'Oldest'])
