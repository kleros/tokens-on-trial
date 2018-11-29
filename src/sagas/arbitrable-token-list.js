import { takeLatest, call, all } from 'redux-saga/effects'

import * as arbitrableTokenListActions from '../actions/arbitrable-token-list'
import { lessduxSaga } from '../utils/saga'
import { arbitrableTokenList, arbitrator } from '../bootstrap/dapp-api'
import * as tokenConstants from '../constants/token'

/**
 * Fetches the arbitrable token list's data.
 * @param {{ type: string, payload: ?object, meta: ?object }} action - The action object.
 * @returns {object} - The fetched data.
 */
export function* fetchArbitrableTokenListData() {
  const d = yield all({
    arbitrator: call(arbitrableTokenList.methods.arbitrator().call),
    stake: call(arbitrableTokenList.methods.stake().call),
    challengeReward: call(arbitrableTokenList.methods.challengeReward().call),
    timeToChallenge: call(arbitrableTokenList.methods.timeToChallenge().call),
    tokensCounts: call(arbitrableTokenList.methods.tokensCounts().call),
    arbitrationFeesWaitingTime: call(
      arbitrableTokenList.methods.arbitrationFeesWaitingTime().call
    )
  })

  arbitrator.options.address = d.arbitrator
  const arbitrationCost = yield call(
    arbitrator.methods.arbitrationCost('0x00').call
  )

  return {
    arbitrator: d.arbitrator,
    challengeReward: Number(d.challengeReward),
    stake: String(d.stake),
    timeToChallenge: Number(d.timeToChallenge) * 1000,
    tokensCounts: tokenConstants.IN_CONTRACT_STATUS_ENUM.values.reduce(
      (acc, value) => {
        acc[value] = Number(d.tokensCounts[value.toLowerCase()])
        return acc
      },
      {}
    ),
    arbitrationCost: String(arbitrationCost),
    arbitrationFeesWaitingTime: Number(d.arbitrationFeesWaitingTime)
  }
}

/**
 * The root of the arbitrable token list saga.
 */
export default function* arbitrableTokenListSaga() {
  // Arbitrable Token List Data
  yield takeLatest(
    arbitrableTokenListActions.arbitrableTokenListData.FETCH,
    lessduxSaga,
    'fetch',
    arbitrableTokenListActions.arbitrableTokenListData,
    fetchArbitrableTokenListData
  )
}
