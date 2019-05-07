import PropTypes from 'prop-types'

import {
  CACHE_BADGES,
  FETCH_BADGES_CACHE,
  FETCH_BADGES_FAILED,
  LOAD_BADGES_STATE
} from '../actions/badges'

import { cacheItemShape } from './generic-shapes'

export const badgesShape = PropTypes.shape({
  loading: PropTypes.bool.isRequired,
  data: PropTypes.objectOf(
    PropTypes.shape({
      badgeContractAddr: PropTypes.string.isRequired,
      items: PropTypes.objectOf(cacheItemShape.isRequired).isRequired,
      statusBlockNumber: PropTypes.number.isRequired
    })
  ).isRequired
})

const initialState = {
  loading: false,
  data: {}
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
        failedLoading: true
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
