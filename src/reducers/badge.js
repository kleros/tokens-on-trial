import PropTypes from 'prop-types'
import createReducer, { createResource } from 'lessdux'
import * as tcrConstants from '../constants/tcr'
import { requestShape } from './generic-shapes'

// Common Shapes
const _badgeShape = PropTypes.shape({
  address: PropTypes.string.isRequired,
  numberOfRequests: PropTypes.number.isRequired,
  status: PropTypes.oneOf(tcrConstants.IN_CONTRACT_STATUS_ENUM.indexes)
    .isRequired,
  latestRequest: requestShape.isRequired,
})
const _badgesShape = PropTypes.arrayOf(_badgeShape.isRequired)

// Shapes
const { shape: badgesShape, initialState: badgesInitialState } = createResource(
  _badgesShape
)
const {
  shape: badgeShape,
  initialState: badgeInitialState,
} = createResource(_badgeShape, { withCreate: true, withUpdate: true })
export { badgesShape, badgeShape, _badgeShape, _badgesShape }

// Reducer
export default createReducer({
  badges: badgesInitialState,
  badge: badgeInitialState,
})

// Selectors
export const getBadges = (state) => state.badge.badges.data
export const getBadgeDisputeID = (state) =>
  state.badge.badge.data && state.badge.badge.data.disputeID
export const getBadgeAppealCost = (state) =>
  state.badge.badge.data && state.badge.badge.data.appealCost
