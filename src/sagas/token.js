import { takeLatest, call, select, all } from 'redux-saga/effects'

import { lessduxSaga } from '../utils/saga'
import { PATCH_TOKEN_URL, arbitrableTokenList } from '../bootstrap/dapp-api'
import * as tokenActions from '../actions/token'
import * as tokenSelectors from '../reducers/token'
import * as walletSelectors from '../reducers/wallet'
import * as tokenConstatns from '../constants/token'

/**
 * Fetches a paginatable list of tokens.
 * @param {{ type: string, payload: ?object, meta: ?object }} action - The action object.
 * @returns {object[]} - The fetched tokens.
 */
function* fetchTokens({ payload: { cursor, count, filterValue, sortValue } }) {
  const data = yield call(
    arbitrableTokenList.methods.queryItems(
      cursor,
      count,
      filterValue,
      sortValue
    ).call,
    { from: yield select(walletSelectors.getAccount) }
  )

  const tokens = [
    ...(cursor === '0x00'
      ? []
      : (yield select(tokenSelectors.getTokens)) || []),
    ...(yield all(
      data.values
        .filter(
          ID =>
            ID !==
            '0x0000000000000000000000000000000000000000000000000000000000000000'
        )
        .map(ID => call(fetchToken, { payload: { ID } }))
    ))
  ]
  tokens.hasMore = data.hasMore
  return tokens
}

const contractStatusToClientStatus = ({ status, disputed }) => {
  if (disputed) return tokenConstatns.STATUS_ENUM.CHALLENGED
  switch (tokenConstatns.IN_CONTRACT_STATUS_ENUM[status]) {
    case 'Submitted':
    case 'Resubmitted':
    case 'ClearingRequested':
    case 'PreventiveClearingRequested':
      return tokenConstatns.STATUS_ENUM.PENDING
    case 'Registered':
      return tokenConstatns.STATUS_ENUM.REGISTERED
    case 'Cleared':
      return tokenConstatns.STATUS_ENUM.CLEARED
    default:
      throw new Error('Unknown status')
  }
}

/**
 * Fetches a token from the list.
 * @param {{ type: string, payload: ?object, meta: ?object }} action - The action object.
 * @returns {object} - The fetched token.
 */
export function* fetchToken({ payload: { ID } }) {
  const token = yield call(arbitrableTokenList.methods.items(ID).call)
  token.latestAgreement = yield call(
    arbitrableTokenList.methods.getAgreementInfo(token.latestAgreementID).call
  )

  return {
    ID,
    status: Number(token.status),
    balance: String(token.balance),
    challengeReward: String(token.balance),
    latestAgreementID: String(token.latestAgreementID),
    latestAgreement: token.latestAgreement,
    lastAction: token.lastAction
      ? new Date(Number(token.lastAction * 1000))
      : null,
    clientStatus: contractStatusToClientStatus({
      status: token.status,
      disputed: token.latestAgreement.disputed
    })
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
  // Tokens
  yield takeLatest(
    tokenActions.tokens.FETCH,
    lessduxSaga,
    'fetch',
    tokenActions.tokens,
    fetchTokens
  )

  // Token
  yield takeLatest(
    tokenActions.token.FETCH,
    lessduxSaga,
    'fetch',
    tokenActions.token,
    fetchToken
  )
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
