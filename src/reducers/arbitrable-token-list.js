import PropTypes from 'prop-types'
import createReducer, { createResource } from 'lessdux'

import { web3 } from '../bootstrap/dapp-api'
import * as tcrConstants from '../constants/tcr'

// Shapes
const {
  shape: arbitrableTokenListDataShape,
  initialState: arbitrableTokenListDataInitialState
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

// Selectors
export const getSubmitCost = state =>
  state.arbitrableTokenList.arbitrableTokenListData.data &&
  web3.utils.toBN(
    state.arbitrableTokenList.arbitrableTokenListData.data.challengeReward
  )

export const getTimeToChallenge = state =>
  state.arbitrableTokenList.arbitrableTokenListData.data &&
  state.arbitrableTokenList.arbitrableTokenListData.data.challengePeriodDuration
