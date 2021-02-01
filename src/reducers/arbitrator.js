import PropTypes from 'prop-types'
import createReducer, { createResource } from 'lessdux'

// Shapes
const {
  shape: arbitratorDataShape,
  initialState: arbitratorDataInitialState,
} = createResource(
  PropTypes.shape({
    arbitrator: PropTypes.string.isRequired,
    arbitratorExtraData: PropTypes.string.isRequired,
    owner: PropTypes.string.isRequired,
    timeOut: PropTypes.number.isRequired,
    appealCost: PropTypes.number.isRequired,
  })
)
export { arbitratorDataShape }

// Reducer
export default createReducer({
  arbitratorData: arbitratorDataInitialState,
})
