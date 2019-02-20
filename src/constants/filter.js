import createEnum from '../utils/create-enum'

// Gallery Settings
export const FILTER_OPTIONS_ENUM = createEnum([
  'Listed',
  'Pending Submissions',
  'Challenged Submissions',
  'Rejected',
  'Removal Requests',
  'Challenged Clearing Requests',
  'My Submissions',
  'My Challenges'
])

export const SORT_OPTIONS_ENUM = createEnum(['Newest', 'Oldest'])
