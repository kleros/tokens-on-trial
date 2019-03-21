import {
  CACHE_TOKENS,
  FETCH_TOKENS_CACHE,
  FETCH_TOKENS_FAILED
} from '../actions/tokens'
import {
  arbitrableTokenListView,
  APP_VERSION,
  T2CR_BLOCK
} from '../bootstrap/dapp-api'

const cachedTokens = localStorage.getItem(
  `${arbitrableTokenListView.options.address}tokens@${APP_VERSION}`
)

const initialState = cachedTokens
  ? JSON.parse(cachedTokens)
  : {
      loading: false,
      loadingFailed: false,
      data: {
        blockNumber: T2CR_BLOCK,
        statusBlockNumber: T2CR_BLOCK,
        items: {},
        addressToIDs: {}
      }
    }

const tokens = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_TOKENS_CACHE: {
      return {
        ...state,
        loading: true
      }
    }
    case FETCH_TOKENS_FAILED: {
      return {
        ...state,
        loading: false,
        loadingFailed: true
      }
    }
    case CACHE_TOKENS: {
      const { tokens } = action.payload
      return {
        data: { ...tokens },
        loading: false
      }
    }
    default:
      return state
  }
}

export default tokens

export const getTokens = state => state.tokens
