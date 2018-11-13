import { takeLatest, call, select, all } from 'redux-saga/effects'

import { lessduxSaga } from '../utils/saga'
import { arbitrableTokenList } from '../bootstrap/dapp-api'
import { hasPendingRequest, contractStatusToClientStatus } from '../utils/token'
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

  token.paidFees = yield call(
    arbitrableTokenList.methods.getFeesInfo(token.latestAgreementID).call
  )

  token.paidFees.firstContributionTime = yield call(
    arbitrableTokenList.methods.paidFees(token.latestAgreementID).call
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
    paidFees: token.paidFees,
    lastAction: token.lastAction
      ? new Date(Number(token.lastAction * 1000))
      : null,
    clientStatus: contractStatusToClientStatus(token)
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
  if (
    Number((yield call(fetchToken, { payload: { ID } })).status) ===
    tokenConstants.IN_CONTRACT_STATUS_ENUM.Absent
  )
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
 * Execute a request for a token.
 * @param {{ type: string, payload: ?object, meta: ?object }} action - The action object.
 * @returns {object} - The `lessdux` collection mod object for updating the list of tokens.
 */
function* requestRegistration({ payload: { ID, metaEvidence } }) {
  // Add to contract if absent
  if (
    Number((yield call(fetchToken, { payload: { ID } })).status) ===
    tokenConstants.IN_CONTRACT_STATUS_ENUM.Cleared
  )
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
 * Request a token to be cleared from the list.
 * @param {{ type: string, payload: ?object, meta: ?object }} action - The action object.
 * @returns {object} - The `lessdux` collection mod object for updating the list of tokens.
 */
function* clearToken({ payload: { ID, metaEvidence } }) {
  // Add to contract if absent
  if (
    Number((yield call(fetchToken, { payload: { ID } })).status) ===
    tokenConstants.IN_CONTRACT_STATUS_ENUM.Registered
  )
    yield call(
      arbitrableTokenList.methods.requestClearing(ID, metaEvidence).send,
      {
        from: yield select(walletSelectors.getAccount),
        value: yield select(arbitrableTokenListSelectors.getSubmitCost)
      }
    )
  else throw new Error(errorConstants.TOKEN_ALREADY_CLEARED)

  return yield call(fetchToken, { payload: { ID } })
}

/**
 * Fund a side of a dispute
 * @param {{ type: string, payload: ?object, meta: ?object }} action - The action object.
 * @returns {object} - The `lessdux` collection mod object for updating the list of tokens.
 */
function* fundDispute({ payload: { ID, value, side } }) {
  // Add to contract if absent
  const token = yield call(fetchToken, { payload: { ID } })
  if (!hasPendingRequest(token))
    throw new Error(errorConstants.NO_PENDING_REQUEST)

  yield call(
    arbitrableTokenList.methods.fundDispute(token.latestAgreementID, side).send,
    {
      from: yield select(walletSelectors.getAccount),
      value
    }
  )

  return yield call(fetchToken, { payload: { ID } })
}

/**
 * Execute a request for a token.
 * @param {{ type: string, payload: ?object, meta: ?object }} action - The action object.
 * @returns {object} - The `lessdux` collection mod object for updating the list of tokens.
 */
function* executeRequest({ payload: { ID } }) {
  if (
    Number((yield call(fetchToken, { payload: { ID } })).status) !==
      tokenConstants.IN_CONTRACT_STATUS_ENUM.Submitted &&
    Number((yield call(fetchToken, { payload: { ID } })).status) !==
      tokenConstants.IN_CONTRACT_STATUS_ENUM.Resubmitted &&
    Number((yield call(fetchToken, { payload: { ID } })).status) !==
      tokenConstants.IN_CONTRACT_STATUS_ENUM.ClearingRequested &&
    Number((yield call(fetchToken, { payload: { ID } })).status) !==
      tokenConstants.IN_CONTRACT_STATUS_ENUM.PreventiveClearingRequested
  )
    throw new Error(errorConstants.TOKEN_IN_WRONG_STATE)

  yield call(arbitrableTokenList.methods.executeRequest(ID).send, {
    from: yield select(walletSelectors.getAccount)
  })

  return yield call(fetchToken, { payload: { ID } })
}

// Update collection mod flows
const updateTokensCollectionModFlow = {
  flow: 'update',
  collection: tokenActions.tokens.self,
  updating: ({ payload: { ID } }) => ID,
  find: ({ payload: { ID } }) => d => d.ID === ID
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
  yield takeLatest(
    tokenActions.token.RESUBMIT,
    lessduxSaga,
    updateTokensCollectionModFlow,
    tokenActions.token,
    requestRegistration
  )
  yield takeLatest(
    tokenActions.token.CLEAR,
    lessduxSaga,
    updateTokensCollectionModFlow,
    tokenActions.token,
    clearToken
  )
  yield takeLatest(
    tokenActions.token.EXECUTE,
    lessduxSaga,
    updateTokensCollectionModFlow,
    tokenActions.token,
    executeRequest
  )
  yield takeLatest(
    tokenActions.token.FUND_DISPUTE,
    lessduxSaga,
    updateTokensCollectionModFlow,
    tokenActions.token,
    fundDispute
  )
}
