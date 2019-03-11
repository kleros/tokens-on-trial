import { ADD_TOKENS } from '../actions/tokens'
import { arbitrableTokenList } from '../bootstrap/dapp-api'

const cachedTokens = localStorage.getItem(
  `${arbitrableTokenList.options.address}tokens`
)

const initialState = cachedTokens
  ? JSON.parse(cachedTokens)
  : { blockNumber: 0 }

const tokens = (state = initialState, action) => {
  switch (action.type) {
    case ADD_TOKENS: {
      const { tokens, blockNumber } = action.payload
      return {
        ...tokens,
        blockNumber
      }
    }
    default:
      return state
  }
}

export default tokens
