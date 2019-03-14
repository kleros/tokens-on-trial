import * as tcrConstants from '../constants/tcr'

export const hasPendingRequest = ({ status, clientStatus, latestRequest }) => {
  if (clientStatus === tcrConstants.STATUS_ENUM.Pending) return true
  if (latestRequest && latestRequest.disputed && !latestRequest.resolved)
    return true

  switch (status) {
    case tcrConstants.IN_CONTRACT_STATUS_ENUM['RegistrationRequested']:
    case tcrConstants.IN_CONTRACT_STATUS_ENUM['ClearingRequested']:
      return true
    default:
      break
  }

  return false
}

export const isRegistrationRequest = tokenStatus =>
  tokenStatus === tcrConstants.IN_CONTRACT_STATUS_ENUM['RegistrationRequested']

export const contractStatusToClientStatus = (status, disputed) => {
  if (disputed)
    switch (tcrConstants.IN_CONTRACT_STATUS_ENUM[status]) {
      case 'RegistrationRequested':
        return tcrConstants.STATUS_ENUM['Submission Challenged']
      case 'ClearingRequested':
        return tcrConstants.STATUS_ENUM['Removal Request Challenged']
      default:
        return Number(status)
    }

  return Number(status)
}

export const getBlock = (block, web3, hash, callback) => {
  if (!block || !block.timestamp)
    // Due to a web3js bug, this method sometimes returns a null block
    // https://github.com/paritytech/parity-ethereum/issues/8788.
    web3.eth.getBlock(hash, (err, block) => {
      if (err) throw err
      getBlock(block, web3, hash, callback)
    })
  else callback(block)
}

// Converts item string data to correct js types.
export const convertFromString = item => {
  const { latestRequest } = item
  item.numberOfRequests = Number(item.numberOfRequests)
  latestRequest.submissionTime = Number(latestRequest.submissionTime) * 1000
  latestRequest.numberOfRounds = Number(latestRequest.numberOfRounds)
  latestRequest.disputeID = latestRequest.dispute
    ? Number(latestRequest.disputeID)
    : 0
  latestRequest.appealDisputeID =
    Number(latestRequest.numberOfRounds) > 1
      ? Number(latestRequest.appealDisputeID)
      : 0

  if (latestRequest.dispute)
    latestRequest.dispute.ruling = Number(latestRequest.dispute.ruling)

  const { latestRound } = latestRequest
  if (
    latestRequest.dispute &&
    latestRequest.dispute.status ===
      tcrConstants.DISPUTE_STATUS.Appealable.toString() &&
    !latestRequest.latestRound.appealed
  ) {
    latestRound.appealPeriod[0] = Number(latestRound.appealPeriod[0]) * 1000
    latestRound.appealPeriod[1] = Number(latestRound.appealPeriod[1]) * 1000
  }

  item.latestRound = latestRound
  return item
}
