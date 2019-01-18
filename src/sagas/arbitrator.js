import { all, call, takeLatest } from 'redux-saga/effects'

import * as arbitratorActions from '../actions/arbitrator'
import { lessduxSaga } from '../utils/saga'
import { arbitrator } from '../bootstrap/dapp-api'

/**
 * Fetches the arbitrators's data.
 * @param {{ type: string, payload: ?object, meta: ?object }} action - The action object.
 * @returns {object} - The fetched data.
 */
export function* fetchArbitratorData() {
  const d = yield all({
    owner: call(arbitrator.methods.owner().call),
    timeOut: call(arbitrator.methods.timeOut().call),
    arbitratorExtraData: call(arbitrator.methods.arbitratorExtraData().call)
  })

  return {
    owner: d.owner,
    timeOut: Number(d.timeOut),
    arbitratorExtraData: d.arbitratorExtraData
  }
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
