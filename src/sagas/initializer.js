import { put, takeLatest, call } from 'redux-saga/effects'

import { INITIALIZE } from '../actions/initialization'
import { setEnvObjects } from '../actions/env-objects'
import { fetchTokens } from '../actions/tokens'
import { fetchBadges } from '../actions/badges'
// import { APP_VERSION } from '../bootstrap/dapp-api'
// import { loadState as loadTokensState } from '../actions/tokens'
// import { loadState as loadBadgesState } from '../actions/badges'
// import { loadState as loadNotificationsState } from '../actions/notification'
// import { loadState as loadFiltersState } from '../actions/notification'
import { fetchAccounts } from '../actions/wallet'
import { instantiateEnvObjects } from '../utils/tcr'

/**
 * Loads cached items and contract instances into redux
 * @param {{ type: string, payload: ?object, meta: ?object }} action - The action object.
 */
function* initialize() {
  const {
    FILE_BASE_URL,
    T2CR_BLOCK,
    ETHFINEX_BADGE_BLOCK,
    ARBITRABLE_ADDRESS_LIST_ADDRESS,
    arbitrableTokenListEvents,
    arbitrableAddressListEvents
  } = yield call(instantiateEnvObjects)

  yield put(
    setEnvObjects({
      FILE_BASE_URL,
      T2CR_BLOCK,
      ETHFINEX_BADGE_BLOCK,
      ARBITRABLE_ADDRESS_LIST_ADDRESS
    })
  )

  if (window.ethereum) {
    window.ethereum.on('accountsChanged', () => {
      fetchAccounts()
    })
    arbitrableTokenListEvents.events.TokenStatusChange(() => {
      fetchTokens()
    })
    arbitrableAddressListEvents.events.AddressStatusChange(() => {
      fetchBadges()
    })
  }

  // const { arbitrableAddressListView, arbitrableTokenListView } = envObjects

  // Load token, badge, filter and notification caches, if any.
  // const cachedTokens = localStorage.getItem(
  //   `${arbitrableTokenListView.options.address}tokens@${APP_VERSION}`
  // )
  // if (cachedTokens) yield put(loadTokensState(JSON.parse(cachedTokens)))

  // const cachedBadges = localStorage.getItem(
  //   `${arbitrableAddressListView.options.address}badges@${APP_VERSION}`
  // )
  // if (cachedBadges) yield put(loadBadgesState(JSON.parse(cachedBadges)))

  // const cachedFilters = localStorage.getItem(
  //   `${arbitrableTokenListView.options.address}filter@${APP_VERSION}`
  // )
  // if (cachedFilters) yield put(loadFiltersState(JSON.parse(cachedFilters)))

  // const cachedNotifications = localStorage.getItem(
  //   `${arbitrableTokenListView.options.address$}.
  //    ${arbitrableAddressListView.options.address}
  //    notifications@${APP_VERSION}`
  // )
  // if (cachedNotifications)
  //   yield put(loadNotificationsState(JSON.parse(cachedNotifications)))
}

/**
 * The root of the tokens saga.
 */
export default function* actionWatcher() {
  yield takeLatest(INITIALIZE, initialize)
}
