import * as tokenConstants from '../constants/token'

export const hasPendingRequest = ({ status, clientStatus, latestRequest }) => {
  if (clientStatus === tokenConstants.STATUS_ENUM.Pending) return true
  if (latestRequest && latestRequest.disputed) return true
  switch (status) {
    case tokenConstants.IN_CONTRACT_STATUS_ENUM['RegistrationRequested']:
    case tokenConstants.IN_CONTRACT_STATUS_ENUM['ClearingRequested']:
      return true
    default:
      break
  }

  return false
}

export const isRegistrationRequest = tokenStatus =>
  tokenStatus ===
  tokenConstants.IN_CONTRACT_STATUS_ENUM['RegistrationRequested']

export const contractStatusToClientStatus = (status, disputed, resolved) => {
  if (disputed && !resolved) return tokenConstants.STATUS_ENUM.Challenged
  switch (tokenConstants.IN_CONTRACT_STATUS_ENUM[status]) {
    case 'RegistrationRequested':
    case 'ClearingRequested':
      return tokenConstants.STATUS_ENUM.Pending
    case 'Registered':
      return tokenConstants.STATUS_ENUM.Registered
    case 'Absent':
      return tokenConstants.STATUS_ENUM.Absent
    default:
      throw new Error('Unknown status: ', status, ' disputed: ', disputed)
  }
}
