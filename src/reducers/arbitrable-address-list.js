import PropTypes from 'prop-types'
import createReducer, { createResource } from 'lessdux'

import * as itemConstants from '../constants/tcr'

// Shapes
const {
  shape: arbitrableAddressListDataShape,
  initialState: arbitrableAddressListDataInitialState
} = createResource(
  PropTypes.objectOf(
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
        itemConstants.IN_CONTRACT_STATUS_ENUM.values.reduce((acc, value) => {
          acc[value] = PropTypes.number.isRequired
          return acc
        }, {})
      ).isRequired
    })
  ).isRequired
)
export { arbitrableAddressListDataShape }

// Reducer
export default createReducer({
  arbitrableAddressListData: arbitrableAddressListDataInitialState
})

// Selectors

export const getWinnerStakeMultiplier = (state, contractAddr) =>
  state.arbitrableAddressList.arbitrableAddressListData.data &&
  state.arbitrableAddressList.arbitrableAddressListData.data[contractAddr] &&
  state.arbitrableAddressList.arbitrableAddressListData.data[contractAddr]
    .winnerStakeMultiplier

export const getLoserStakeMultiplier = (state, contractAddr) =>
  state.arbitrableAddressList.arbitrableAddressListData.data &&
  state.arbitrableAddressList.arbitrableAddressListData.data[contractAddr] &&
  state.arbitrableAddressList.arbitrableAddressListData.data[contractAddr]
    .loserStakeMultiplier

export const getSharedStakeMultiplier = (state, contractAddr) =>
  state.arbitrableAddressList.arbitrableAddressListData.data &&
  state.arbitrableAddressList.arbitrableAddressListData.data[contractAddr] &&
  state.arbitrableAddressList.arbitrableAddressListData.data[contractAddr]
    .sharedStakeMultiplier

export const getTimeToChallenge = (state, contractAddr) =>
  state.arbitrableAddressList.arbitrableAddressListData.data &&
  state.arbitrableAddressList.arbitrableAddressListData.data[contractAddr] &&
  state.arbitrableAddressList.arbitrableAddressListData.data[contractAddr]
    .challengePeriodDuration
