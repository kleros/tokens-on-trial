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
    stake: PropTypes.string.isRequired,
    timeToChallenge: PropTypes.number.isRequired,
    itemsCounts: PropTypes.shape(
      tokenConstants.STATUS_ENUM.values.reduce((acc, value) => {
        acc[value] = PropTypes.number.isRequired
        return acc
      }, {})
    ).isRequired,
    arbitrationCost: PropTypes.string.isRequired
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
  web3.utils
    .toBN(state.arbitrableTokenList.arbitrableTokenListData.data.stake)
    .add(
      web3.utils.toBN(
        state.arbitrableTokenList.arbitrableTokenListData.data.arbitrationCost
      )
    )
export const getTimeToChallenge = state =>
  state.arbitrableTokenList.arbitrableTokenListData.data &&
  state.arbitrableTokenList.arbitrableTokenListData.data.timeToChallenge
