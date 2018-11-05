import PropTypes from 'prop-types'
import createReducer, { createResource } from 'lessdux'

import * as tokenConstants from '../constants/token'

// Common Shapes
export const _tokenShape = PropTypes.shape({
  ID: PropTypes.string.isRequired,
  status: PropTypes.oneOf(tokenConstants.IN_CONTRACT_STATUS_ENUM.indexes)
    .isRequired,
  lastAction: PropTypes.instanceOf(Date),
  latestAgreementID: PropTypes.string.isRequired,
  balance: PropTypes.string.isRequired,
  challengeReward: PropTypes.string.isRequired,
  latestAgreement: PropTypes.shape({
    appealed: PropTypes.bool.isRequired,
    arbitrationFeesWaitingTime: PropTypes.string.isRequired,
    arbitrator: PropTypes.string.isRequired,
    creator: PropTypes.string.isRequired,
    disputeID: PropTypes.string.isRequired,
    disputed: PropTypes.bool.isRequired,
    executed: PropTypes.bool.isRequired,
    extraData: PropTypes.string,
    numberOfChoices: PropTypes.string.isRequired,
    parties: PropTypes.arrayOf(PropTypes.string).isRequired,
    ruling: PropTypes.string.isRequired
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
