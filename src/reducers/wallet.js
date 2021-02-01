import PropTypes from 'prop-types'
import createReducer, { createResource } from 'lessdux'

// Shapes
const {
  shape: accountsShape,
  initialState: accountsInitialState,
} = createResource(PropTypes.arrayOf(PropTypes.string.isRequired))
const {
  shape: balanceShape,
  initialState: balanceInitialState,
} = createResource(PropTypes.string)
const {
  shape: settingsShape,
  initialState: settingsInitialState,
} = createResource(
  PropTypes.shape({
    dispute: PropTypes.bool.isRequired,
    shouldFund: PropTypes.bool.isRequired,
    rulingGiven: PropTypes.bool.isRequired,
    requestSubmitted: PropTypes.bool.isRequired,
  }),
  {
    withUpdate: true,
  }
)

export { accountsShape, balanceShape, settingsShape }

// Reducer
export default createReducer({
  accounts: accountsInitialState,
  balance: balanceInitialState,
  settings: {
    ...settingsInitialState,
    data: {
      dispute: true,
      shouldFund: true,
      rulingGiven: true,
      requestSubmitted: true,
      name: '',
      email: '',
    },
  },
})

// Selectors
export const getAccount = (state) =>
  state.wallet.accounts.data && state.wallet.accounts.data[0]
