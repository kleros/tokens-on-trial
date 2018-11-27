import * as tokenConstants from '../constants/token'

export const hasPendingRequest = ({
  status,
  clientStatus,
  latestAgreement
}) => {
  if (clientStatus === tokenConstants.STATUS_ENUM.Pending) return true
  if (latestAgreement && latestAgreement.disputed) return true
  switch (status) {
    case tokenConstants.IN_CONTRACT_STATUS_ENUM['Submitted']:
    case tokenConstants.IN_CONTRACT_STATUS_ENUM['Resubmitted']:
    case tokenConstants.IN_CONTRACT_STATUS_ENUM['ClearingRequested']:
    case tokenConstants.IN_CONTRACT_STATUS_ENUM['PreventiveClearingRequested']:
      return true
    default:
      break
  }

  return false
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

export const contractStatusToClientStatus = ({ status, latestRequest }) => {
  if (latestRequest.disputed) return tokenConstants.STATUS_ENUM.Challenged
  switch (tokenConstants.IN_CONTRACT_STATUS_ENUM[status]) {
    case 'Submitted':
    case 'Resubmitted':
    case 'ClearingRequested':
    case 'PreventiveClearingRequested':
      return tokenConstants.STATUS_ENUM.Pending
    case 'Registered':
      return tokenConstants.STATUS_ENUM.Registered
    case 'Cleared':
      return tokenConstants.STATUS_ENUM.Cleared
    case 'Absent':
      return tokenConstants.STATUS_ENUM.Absent
    default:
      throw new Error(
        'Unknown status: ',
        status,
        ' disputed: ',
        latestRequest.disputed
      )
  }
}
