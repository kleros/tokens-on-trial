import PropTypes from 'prop-types'
import createReducer, { createResource } from 'lessdux'
import * as tcrConstants from '../constants/tcr'
import { requestShape } from './generic-shapes'

// Common Shapes
export const _tokenShape = PropTypes.shape({
  ID: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  ticker: PropTypes.string.isRequired,
  symbolMultihash: PropTypes.string.isRequired,
  status: PropTypes.oneOf(tcrConstants.IN_CONTRACT_STATUS_ENUM.indexes)
    .isRequired,
  latestRequest: requestShape.isRequired,
})

export const _cacheTokenShape = PropTypes.shape({
  ID: PropTypes.string.isRequired,
  address: PropTypes.string.isRequired,
  clientStatus: PropTypes.number.isRequired,
  name: PropTypes.string.isRequired,
  symbolMultihash: PropTypes.string.isRequired,
  ticker: PropTypes.string.isRequired,
  status: PropTypes.shape({
    blockNumber: PropTypes.number.isRequired,
    challenger: PropTypes.string.isRequired,
    disputed: PropTypes.bool.isRequired,
    requester: PropTypes.string.isRequired,
    status: PropTypes.number.isRequired,
  }).isRequired,
})

export const _tokensShape = PropTypes.shape({
  items: PropTypes.objectOf(_cacheTokenShape.isRequired).isRequired,
  addressToIDs: PropTypes.objectOf(
    PropTypes.arrayOf(PropTypes.string.isRequired).isRequired
  ),
  blockNumber: PropTypes.number.isRequired,
  statusBlockNumber: PropTypes.number.isRequired,
})

// Shapes
const { shape: tokensShape, initialState: tokensInitialState } = createResource(
  _tokensShape
)
const {
  shape: tokenShape,
  initialState: tokenInitialState,
} = createResource(_tokenShape, { withCreate: true, withUpdate: true })
export { tokensShape, tokenShape }

// Reducer
export default createReducer({
  tokens: tokensInitialState,
  token: tokenInitialState,
})

// Selectors
export const getTokens = (state) => state.token.tokens.data
export const getTokenDisputeID = (state) =>
  state.token.token.data && state.token.token.data.disputeID
export const getTokenAppealCost = (state) =>
  state.token.token.data && state.token.token.data.appealCost
