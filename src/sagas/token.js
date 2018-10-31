import { takeLatest, call } from 'redux-saga/effects'

import { lessduxSaga } from '../utils/saga'
import { PATCH_TOKEN_URL, arbitrableTokenList } from '../bootstrap/dapp-api'
import * as tokenActions from '../actions/token'

/**
 * Fetches a token from the list.
 * @param {{ type: string, payload: ?object, meta: ?object }} action - The action object.
 * @returns {object} - The fetched token.
 */
export function* fetchToken({ payload: { ID } }) {
  const token = yield call(arbitrableTokenList.methods.items(ID).call)

  return {
    ID,
    status: token.status,
    balance: String(token.balance),
    challengeReward: String(token.balance),
    latestAgreementID: String(token.latestAgreementID),
    lastAction: token.lastAction
      ? new Date(Number(token.lastAction * 1000))
      : null
  }
}

/**
 * Submits a token to the list.
 * @param {{ type: string, payload: ?object, meta: ?object }} action - The action object.
 * @returns {object} - The `lessdux` collection mod object for updating the list of tokens.
 */
function* createToken({ payload: { token } }) {
  // Upload token
  const response = yield call(fetch, PATCH_TOKEN_URL, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ payload: { token } })
  })

  // TODO: submit to contract
  console.info('upload response:', response)

  // Return the response
  return response
}

/**
 * The root of the token saga.
 */
export default function* tokenSaga() {
  // Token
  yield takeLatest(
    tokenActions.token.CREATE,
    lessduxSaga,
    {
      flow: 'create',
      collection: tokenActions.tokens.self
    },
    tokenActions.token,
    createToken
  )
}
