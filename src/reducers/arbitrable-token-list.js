import PropTypes from 'prop-types'
import createReducer, { createResource } from 'lessdux'

import * as tcrConstants from '../constants/tcr'

// Shapes
const {
  shape: arbitrableTokenListDataShape,
  initialState: arbitrableTokenListDataInitialState
} = createResource(
  PropTypes.shape({
    arbitrator: PropTypes.string.isRequired,
    requesterBaseDeposit: PropTypes.shape({}).isRequired, // BigNumber
    challengerBaseDeposit: PropTypes.shape({}).isRequired, // BigNumber
    challengePeriodDuration: PropTypes.number.isRequired,
    arbitrationCost: PropTypes.shape({}).isRequired, // BigNumber
    winnerStakeMultiplier: PropTypes.shape({}).isRequired, // BigNumber
    loserStakeMultiplier: PropTypes.shape({}).isRequired, // BigNumber
    sharedStakeMultiplier: PropTypes.shape({}).isRequired, // BigNumber
    countByStatus: PropTypes.shape(
      tcrConstants.IN_CONTRACT_STATUS_ENUM.values.reduce((acc, value) => {
        acc[value] = PropTypes.number.isRequired
        return acc
      }, {})
    ).isRequired
  })
)
export { arbitrableTokenListDataShape }

// Reducer
export default createReducer({
  arbitrableTokenListData: arbitrableTokenListDataInitialState
})

export const getWinnerStakeMultiplier = state =>
  state.arbitrableAddressList.arbitrableAddressListData.data &&
  state.arbitrableAddressList.arbitrableAddressListData.data
    .winnerStakeMultiplier

export const getLoserStakeMultiplier = state =>
  state.arbitrableAddressList.arbitrableAddressListData.data &&
  state.arbitrableAddressList.arbitrableAddressListData.data
    .loserStakeMultiplier

export const getSharedStakeMultiplier = state =>
  state.arbitrableAddressList.arbitrableAddressListData.data &&
  state.arbitrableAddressList.arbitrableAddressListData.data
    .sharedStakeMultiplier

// Selectors

export const getTimeToChallenge = state =>
  state.arbitrableTokenList.arbitrableTokenListData.data &&
  state.arbitrableTokenList.arbitrableTokenListData.data.challengePeriodDuration
