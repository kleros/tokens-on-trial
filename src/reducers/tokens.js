import {
  CACHE_TOKENS,
  FETCH_TOKENS_CACHE,
  FETCH_TOKENS_FAILED,
  LOAD_TOKENS_STATE,
} from '../actions/tokens'

const initialState = {
  loading: false,
  failedLoading: false,
  data: {
    blockNumber: 0,
    statusBlockNumber: 0,
    items: {},
    addressToIDs: {},
  },
}

const tokens = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_TOKENS_CACHE: {
      return {
        ...state,
        loading: true,
      }
    }
    case FETCH_TOKENS_FAILED: {
      return {
        ...state,
        loading: false,
        failedLoading: true,
      }
    }
    case CACHE_TOKENS: {
      const { tokens } = action.payload
      return {
        data: { ...tokens },
        loading: false,
        failedLoading: false,
      }
    }
    case LOAD_TOKENS_STATE: {
      const { data } = action.payload
      return {
        ...state,
        data,
      }
    }
    default:
      return state
  }
}

export default tokens

export const getTokens = (state) => state.tokens
