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

export const isRegistrationRequest = (tokenStatus) =>
  tokenStatus === tcrConstants.IN_CONTRACT_STATUS_ENUM['RegistrationRequested']

export const getBlock = (block, web3, hash, callback) => {
  if (!block || !block.timestamp)
    // Due to a web3js this method sometimes returns a null block https://github.com/paritytech/parity-ethereum/issues/8788.
    web3.eth.getBlock(hash, (err, block) => {
      if (err) throw err
      getBlock(block, web3, hash, callback)
    })
  else callback(block)
}
