import {
  CACHE_BADGES,
  FETCH_BADGES_CACHE,
  FETCH_BADGES_FAILED,
  LOAD_BADGES_STATE
} from '../actions/badges'

const initialState = {
  loading: false,
  data: {
    statusBlockNumber: 0,
    items: {}
  }
}

const badges = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_BADGES_CACHE: {
      return {
        ...state,
        loading: true
      }
    }
    case FETCH_BADGES_FAILED: {
      return {
        ...state,
        loading: false,
        loadingFailed: true
      }
    }
    case CACHE_BADGES: {
      const { badges } = action.payload
      return {
        data: { ...badges },
        loading: false
      }
    }
    case LOAD_BADGES_STATE: {
      const { data } = action.payload
      return {
        ...state,
        data
      }
    }
    default:
      return state
  }
}

export default badges

export const getBadges = state => state.badges
