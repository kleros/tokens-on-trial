import { all, call, takeLatest, select } from 'redux-saga/effects'

import * as arbitratorActions from '../actions/arbitrator'
import { lessduxSaga } from '../utils/saga'
import * as envObjectSelectors from '../reducers/env-objects'

/**
 * Fetches the arbitrators's data.
 * @param {{ type: string, payload: ?object, meta: ?object }} action - The action object.
 * @returns {object} - The fetched data.
 */
export function* fetchArbitratorData() {
  // const { arbitratorView } = yield select(envObjectSelectors.getEnvObjects)
  // const d = yield all({
  //   arbitratorExtraData: call(arbitratorView.methods.arbitratorExtraData().call)
  // })
  // return {
  //   owner: d.owner,
  //   timeOut: Number(d.timeOut),
  //   arbitratorExtraData: d.arbitratorExtraData
  // }
}

/**
 * The root of the arbitrable token list saga.
 */
export default function* arbitratorSaga() {
  // Arbitrable Token List Data
  yield takeLatest(
    arbitratorActions.arbitratorData.FETCH,
    lessduxSaga,
    'fetch',
    arbitratorActions.arbitratorData,
    fetchArbitratorData
  )
}
