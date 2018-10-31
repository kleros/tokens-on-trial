import { takeLatest, call } from 'redux-saga/effects'

import * as tokenActions from '../actions/token'
import { lessduxSaga } from '../utils/saga'
import { PATCH_TOKEN_URL } from '../bootstrap/dapp-api'

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
