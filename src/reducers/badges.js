import { CACHE_BADGES, FETCH_BADGES_CACHE } from '../actions/badges'
import { arbitrableAddressList } from '../bootstrap/dapp-api'

const cachedBadges = localStorage.getItem(
  `${arbitrableAddressList.options.address}badges`
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
        data: {
          ...state.data,
          ...badges
        },
        loading: false
      }
    }
    default:
      return state
  }
}

export default badges

export const getBadges = state => state.badges
