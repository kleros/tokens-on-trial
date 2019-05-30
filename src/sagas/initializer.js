import { put, takeLatest, call } from 'redux-saga/effects'

import { INITIALIZE } from '../actions/initialization'
import { setEnvObjects } from '../actions/env-objects'
import { loadState as loadFiltersState } from '../actions/filter'
import { instantiateEnvObjects } from '../utils/tcr'
import { APP_VERSION } from '../bootstrap/dapp-api'

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
    arbitrableTokenListView,
    networkID
  } = yield call(instantiateEnvObjects)

  yield put(
    setEnvObjects({
      FILE_BASE_URL,
      T2CR_BLOCK,
      ETHFINEX_BADGE_BLOCK,
      ARBITRABLE_ADDRESS_LIST_ADDRESS,
      networkID
    })
  )

  // Clear cache if app version changed.
  const latestAppVersion = localStorage.getItem('LATEST_APP_VERSION')
  if (latestAppVersion !== APP_VERSION) {
    localStorage.clear()
    localStorage.setItem('LATEST_APP_VERSION', APP_VERSION)
    window.location.reload(true)
  }

  // Load filter cache, if any.
  const cachedFilters = localStorage.getItem(
    `${arbitrableTokenListView.options.address}filter@${APP_VERSION}`
  )
  if (cachedFilters) yield put(loadFiltersState(JSON.parse(cachedFilters)))
}

/**
 * The root of the tokens saga.
 */
export default function* actionWatcher() {
  yield takeLatest(INITIALIZE, initialize)
}
