import { CACHE_BADGES, FETCH_BADGES_CACHE } from '../actions/badges'
import { arbitrableAddressList, APP_VERSION } from '../bootstrap/dapp-api'

const cachedBadges = localStorage.getItem(
  `${arbitrableAddressList.options.address}badges@${APP_VERSION}`
)

const initialState = cachedBadges
  ? JSON.parse(cachedBadges)
  : {
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
