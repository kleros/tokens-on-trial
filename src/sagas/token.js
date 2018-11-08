import { takeLatest, call, select, all } from 'redux-saga/effects'

import { lessduxSaga } from '../utils/saga'
import { arbitrableTokenList } from '../bootstrap/dapp-api'
import * as tokenActions from '../actions/token'
import * as tokenSelectors from '../reducers/token'
import * as walletSelectors from '../reducers/wallet'
import * as tokenConstants from '../constants/token'
import * as arbitrableTokenListSelectors from '../reducers/arbitrable-token-list'
import * as errorConstants from '../constants/error'

import storeApi from './api/store'

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
  if (disputed) return tokenConstants.STATUS_ENUM.CHALLENGED
  switch (tokenConstants.IN_CONTRACT_STATUS_ENUM[status]) {
    case 'Submitted':
    case 'Resubmitted':
    case 'ClearingRequested':
    case 'PreventiveClearingRequested':
      return tokenConstants.STATUS_ENUM.PENDING
    case 'Registered':
      return tokenConstants.STATUS_ENUM.REGISTERED
    case 'Cleared':
      return tokenConstants.STATUS_ENUM.CLEARED
    case 'Absent':
      return tokenConstants.STATUS_ENUM.ABSENT
    default:
      throw new Error('Unknown status: ', status, ' disputed: ', disputed)
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

  const { tokenName, address, ticker, URI } = yield call(storeApi.getFile, ID)

  return {
    ID,
    tokenName,
    address,
    ticker,
    URI,
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
function* createToken({ payload: { token, metaEvidence } }) {
  // Upload token
  const response = yield call(storeApi.postFile, JSON.stringify(token))

  const { payload } = response
  const ID = payload.fileURL.split('/')[3].split('.')[0] // Taking tokenID from URL.

  // Add to contract if absent
  if (Number((yield call(fetchToken, { payload: { ID } })).status) === 0)
    yield call(
      arbitrableTokenList.methods.requestRegistration(ID, metaEvidence).send,
      {
        from: yield select(walletSelectors.getAccount),
        value: yield select(arbitrableTokenListSelectors.getSubmitCost)
      }
    )
  else throw new Error(errorConstants.TOKEN_ALREADY_SUBMITTED)

  return yield call(fetchToken, { payload: { ID } })
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
