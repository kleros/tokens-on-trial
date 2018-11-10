import * as tokenConstants from '../constants/token'

export const hasPendingRequest = tokenStatus => {
  switch (tokenStatus) {
    case tokenConstants.IN_CONTRACT_STATUS_ENUM['Submitted']:
    case tokenConstants.IN_CONTRACT_STATUS_ENUM['Resubmitted']:
    case tokenConstants.IN_CONTRACT_STATUS_ENUM['ClearingRequested']:
    case tokenConstants.IN_CONTRACT_STATUS_ENUM['PreventiveClearingRequested']:
      return true
    default:
      return false
  }
}

export const isRegistrationRequest = tokenStatus => {
  switch (tokenStatus) {
    case tokenConstants.IN_CONTRACT_STATUS_ENUM['Submitted']:
    case tokenConstants.IN_CONTRACT_STATUS_ENUM['Resubmitted']:
      return true
    default:
      return false
  }
}
