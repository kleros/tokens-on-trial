import createEnum from '../utils/create-enum'

// Token
export const IN_CONTRACT_STATUS_ENUM = createEnum([
  'Absent', // The item has never been submitted.
  'Cleared', // The item has been submitted and the dispute resolution process determined it should not be added or a clearing request has been submitted and not contested.
  'Resubmitted', // The item has been cleared but someone has resubmitted it.
  'Registered', // The item has been submitted and the dispute resolution process determined it should be added or the submission was never contested.
  'Submitted', // The item has been submitted.
  'ClearingRequested', // The item is registered, but someone has requested to remove it.
  'PreventiveClearingRequested' // The item has never been registered, but someone asked to clear it preemptively to avoid it being shown as not registered during the dispute resolution process.
])
export const RULING_ENUM = createEnum(['Pending', 'Executed', 'Refused'])

// Gallery Settings
export const FILTER_OPTIONS_ENUM = createEnum([
  ...IN_CONTRACT_STATUS_ENUM.values.filter(
    v => v !== IN_CONTRACT_STATUS_ENUM.Absent
  ),
  'My Submissions',
  'My Challenges'
])
export const SORT_OPTIONS_ENUM = createEnum(['Newest', 'Oldest'])
