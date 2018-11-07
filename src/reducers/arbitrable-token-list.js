import PropTypes from 'prop-types'
import createReducer, { createResource } from 'lessdux'

import { web3 } from '../bootstrap/dapp-api'
import * as tokenConstants from '../constants/token'

// Shapes
const {
  shape: arbitrableTokenListDataShape,
  initialState: arbitrableTokenListDataInitialState
} = createResource(
  PropTypes.shape({
    arbitrator: PropTypes.string.isRequired,
    challengeReward: PropTypes.number.isRequired,
    stake: PropTypes.string.isRequired,
    timeToChallenge: PropTypes.number.isRequired,
    itemsCounts: PropTypes.shape(
      tokenConstants.IN_CONTRACT_STATUS_ENUM.values.reduce((acc, value) => {
        acc[value] = PropTypes.number.isRequired
        return acc
      }, {})
    ).isRequired,
    arbitrationFeesWaitingTime: PropTypes.number.isRequired
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
  state.arbitrableTokenList.arbitrableTokenListData.data.timeToChallenge
