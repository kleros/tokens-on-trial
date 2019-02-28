import PropTypes from 'prop-types'
import createReducer, { createResource } from 'lessdux'

import { web3 } from '../bootstrap/dapp-api'
import * as itemConstants from '../constants/tcr'

// Shapes
const {
  shape: arbitrableAddressListDataShape,
  initialState: arbitrableAddressListDataInitialState
} = createResource(
  PropTypes.shape({
    arbitrator: PropTypes.string.isRequired,
    governor: PropTypes.string.isRequired,
    challengeReward: PropTypes.number.isRequired,
    challengePeriodDuration: PropTypes.number.isRequired,
    arbitrationCost: PropTypes.number.isRequired,
    winnerStakeMultiplier: PropTypes.number.isRequired,
    loserStakeMultiplier: PropTypes.number.isRequired,
    sharedStakeMultiplier: PropTypes.number.isRequired,
    countByStatus: PropTypes.shape(
      itemConstants.IN_CONTRACT_STATUS_ENUM.values.reduce((acc, value) => {
        acc[value] = PropTypes.number.isRequired
        return acc
      }, {})
    ).isRequired
  })
)
export { arbitrableAddressListDataShape }

// Reducer
export default createReducer({
  arbitrableAddressListData: arbitrableAddressListDataInitialState
})

// Selectors
export const getSubmitCost = state =>
  state.arbitrableAddressList.arbitrableAddressListData.data &&
  web3.utils.toBN(
    state.arbitrableAddressList.arbitrableAddressListData.data.challengeReward
  )

export const getTimeToChallenge = state =>
  state.arbitrableAddressList.arbitrableAddressListData.data &&
  state.arbitrableAddressList.arbitrableAddressListData.data
    .challengePeriodDuration
