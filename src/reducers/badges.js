import {
  CACHE_BADGES,
  FETCH_BADGES_CACHE,
  FETCH_BADGES_FAILED
} from '../actions/badges'
import {
  arbitrableAddressListView,
  APP_VERSION,
  FROM_BLOCK
} from '../bootstrap/dapp-api'

const cachedBadges = localStorage.getItem(
  `${arbitrableAddressListView.options.address}badges@${APP_VERSION}`
)

const initialState = cachedBadges
  ? JSON.parse(cachedBadges)
  : {
      loading: false,
      data: {
        statusBlockNumber: FROM_BLOCK,
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
    default:
      return state
  }
}

export default badges

export const getBadges = state => state.badges
