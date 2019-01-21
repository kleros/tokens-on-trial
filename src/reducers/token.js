import PropTypes from 'prop-types'
import createReducer, { createResource } from 'lessdux'

import * as tokenConstants from '../constants/token'

// Common Shapes
export const _tokenShape = PropTypes.shape({
  ID: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  ticker: PropTypes.string.isRequired,
  symbolMultihash: PropTypes.string.isRequired,
  networkID: PropTypes.string.isRequired,
  status: PropTypes.oneOf(tokenConstants.IN_CONTRACT_STATUS_ENUM.indexes)
    .isRequired,
  latestRequest: PropTypes.shape({
    disputed: PropTypes.bool.isRequired,
    disputeID: PropTypes.number.isRequired,
    submissionTime: PropTypes.number.isRequired,
    challengerDepositTime: PropTypes.number.isRequired,
    challengeRewardBalance: PropTypes.string.isRequired,
    numberOfRounds: PropTypes.number.isRequired,
    parties: PropTypes.arrayOf(PropTypes.string).isRequired,
    dispute: PropTypes.shape({
      arbitrated: PropTypes.string.isRequired,
      choices: PropTypes.string.isRequired,
      fee: PropTypes.string.isRequired,
      ruling: PropTypes.string.isRequired,
      status: PropTypes.string.isRequired
    }),
    latestRound: PropTypes.shape({
      appealed: PropTypes.bool.isRequired,
      requiredForSide: PropTypes.arrayOf(PropTypes.number).isRequired,
      paidFees: PropTypes.arrayOf(PropTypes.number).isRequired
    })
  }).isRequired
})
export const _tokensShape = PropTypes.arrayOf(_tokenShape.isRequired)

// Shapes
const { shape: tokensShape, initialState: tokensInitialState } = createResource(
  _tokensShape
)
const { shape: tokenShape, initialState: tokenInitialState } = createResource(
  _tokenShape,
  { withCreate: true, withUpdate: true }
)
export { tokensShape, tokenShape }

// Reducer
export default createReducer({
  tokens: tokensInitialState,
  token: tokenInitialState
})

// Selectors
export const getTokens = state => state.token.tokens.data
export const getTokenDisputeID = state =>
  state.token.token.data && state.token.token.data.disputeID
export const getTokenAppealCost = state =>
  state.token.token.data && state.token.token.data.appealCost
