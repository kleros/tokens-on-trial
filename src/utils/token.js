import * as tokenConstants from '../constants/token'

export const hasPendingRequest = ({ status, clientStatus, latestRequest }) => {
  if (clientStatus === tokenConstants.STATUS_ENUM.Pending) return true
  if (latestRequest && latestRequest.disputed && !latestRequest.resolved)
    return true
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

export const contractStatusToClientStatus = (status, disputed) => {
  if (disputed)
    switch (tokenConstants.IN_CONTRACT_STATUS_ENUM[status]) {
      case 'RegistrationRequested':
        return tokenConstants.STATUS_ENUM['Registration Request Challenged']
      case 'ClearingRequested':
        return tokenConstants.STATUS_ENUM['Clearing Request Challenged']
      default:
        return tokenConstants.STATUS_ENUM[status]
    }

  return tokenConstants.STATUS_ENUM[status]
}
