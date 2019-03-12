import { CACHE_TOKENS } from '../actions/tokens'
import { arbitrableTokenList } from '../bootstrap/dapp-api'

const cachedTokens = localStorage.getItem(
  `${arbitrableTokenList.options.address}tokens`
)

const initialState = cachedTokens
  ? JSON.parse(cachedTokens)
  : {
      blockNumber: 0,
      statusBlockNumber: 0
    }

const tokens = (state = initialState, action) => {
  switch (action.type) {
    case CACHE_TOKENS: {
      const { tokens } = action.payload
      return tokens
    }
    default:
      return state
  }
}

export default tokens
