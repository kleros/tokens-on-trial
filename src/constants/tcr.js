import createEnum from '../utils/create-enum'

// Token
export const IN_CONTRACT_STATUS_ENUM = createEnum([
  'Absent', // The item has never been submitted.
  'Registered', // The item has been submitted and the dispute resolution process determined it should be added or the submission was never contested.
  'RegistrationRequested', // The item has been submitted.
  'ClearingRequested', // The item is registered, but someone has requested to remove it.
])

export const COURT_PERIOD = createEnum([
  'Evidence',
  'Commit',
  'Vote',
  'Appeal',
  'Execution',
])

export const COURT_PERIOD_STRINGS = createEnum([
  'Evidence period ends in ',
  'Jurors are voting ',
  'Jurors are voting ',
  'Appeal',
  'Execution',
])
export const DISPUTE_STATUS = createEnum(['Waiting', 'Appealable', 'Solved'])
export const RULING_OPTIONS = createEnum(['None', 'Accept', 'Refuse'])
export const SIDE = createEnum(['None', 'Requester', 'Challenger'])
export const STATUS_ENUM = createEnum([
  'Absent',
  'Registered',
  'Submission Pending',
  'Removal Requested',
  'Submission Challenged',
  'Removal Request Challenged',
])
export const BADGE_STATUS_ENUM = createEnum([
  'Absent',
  'Added',
  'Addition Requested',
  'Removal Requested',
  'Addition Challenged',
  'Removal Challenged',
])

export const STATUS_ICON_ENUM = createEnum([
  'times-circle',
  'check',
  'hourglass-half',
  'hourglass-half',
  'gavel',
  'gavel',
])

export const STATUS_COLOR_ENUM = createEnum([
  '#EF0101', // Red
  '#009aff', // Blue
  '#4a4a4a', // Grey
  '#4a4a4a', // Grey
  '#FB7413', // Orange
  '#FB7413', // Orange
])

// helloThere => Hello There
export const camelCaseAddSpaces = (str) =>
  str.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())
