import PropTypes from 'prop-types'

import * as tcrConstants from '../constants/tcr'

export const cacheItemShape = PropTypes.shape({
  address: PropTypes.string.isRequired,
  blockNumber: PropTypes.number.isRequired,
  clientStatus: PropTypes.number.isRequired,
  status: PropTypes.shape({
    challenger: PropTypes.string.isRequired,
    requester: PropTypes.string.isRequired,
    status: PropTypes.number.isRequired
  }).isRequired
})

export const tcrShape = PropTypes.shape({
  requesterBaseDeposit: PropTypes.shape({}).isRequired, // BigNumber
  challengerBaseDeposit: PropTypes.shape({}).isRequired, // BigNumber
  challengePeriodDuration: PropTypes.number.isRequired,
  arbitrationCost: PropTypes.shape({}).isRequired, // BigNumber
  winnerStakeMultiplier: PropTypes.shape({}).isRequired, // BigNumber
  loserStakeMultiplier: PropTypes.shape({}).isRequired, // BigNumber
  sharedStakeMultiplier: PropTypes.shape({}).isRequired // BigNumber
})

export const envObjectsShape = PropTypes.shape({
  FILE_BASE_URL: PropTypes.string.isRequired,
  T2CR_BLOCK: PropTypes.string.isRequired,
  ETHFINEX_BADGE_BLOCK: PropTypes.string.isRequired,
  ARBITRABLE_ADDRESS_LIST_ADDRESS: PropTypes.string.isRequired
})

export const courtShape = PropTypes.shape({
  timesPerPeriod: PropTypes.arrayOf(PropTypes.number.isRequired).isRequired
})

export const disputeShape = PropTypes.shape({
  ruling: PropTypes.number.isRequired,
  status: PropTypes.number.isRequired,
  lastPeriodChange: PropTypes.number.isRequired,
  period: PropTypes.number.isRequired,
  court: courtShape.isRequired
})

export const roundShape = PropTypes.shape({
  appealed: PropTypes.bool.isRequired,
  hasPaid: PropTypes.arrayOf(PropTypes.bool).isRequired,
  paidFees: PropTypes.arrayOf(PropTypes.shape({})).isRequired // BigNumber.
})

export const requestShape = PropTypes.shape({
  disputed: PropTypes.bool.isRequired,
  disputeID: PropTypes.number.isRequired,
  submissionTime: PropTypes.number.isRequired,
  numberOfRounds: PropTypes.number.isRequired,
  parties: PropTypes.arrayOf(PropTypes.string).isRequired,
  dispute: disputeShape,
  latestRound: roundShape.isRequired
})

export const itemShape = PropTypes.shape({
  address: PropTypes.string.isRequired,
  numberOfRequests: PropTypes.number.isRequired,
  status: PropTypes.oneOf(tcrConstants.IN_CONTRACT_STATUS_ENUM.indexes)
    .isRequired,
  latestRequest: requestShape.isRequired
})
