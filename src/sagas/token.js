import { takeLatest, call, select, all } from 'redux-saga/effects'

import { lessduxSaga } from '../utils/saga'
import { arbitrableTokenList, arbitrator, web3 } from '../bootstrap/dapp-api'
import { hasPendingRequest, contractStatusToClientStatus } from '../utils/token'
import * as tokenActions from '../actions/token'
import * as tokenSelectors from '../reducers/token'
import * as walletSelectors from '../reducers/wallet'
import * as tokenConstants from '../constants/token'
import * as arbitrableTokenListSelectors from '../reducers/arbitrable-token-list'
import * as errorConstants from '../constants/error'

import storeApi from './api/store'

// Converts token string data to correct js types.
const convertFromString = token => {
  const { latestRequest } = token
  latestRequest.firstContributionTime = Number(
    latestRequest.firstContributionTime
  )
  latestRequest.arbitrationFeesWaitingTime = Number(
    latestRequest.arbitrationFeesWaitingTime
  )
  latestRequest.timeToChallenge = Number(latestRequest.timeToChallenge)

  const { latestRound } = latestRequest
  latestRound.ruling = Number(latestRound.ruling)
  latestRound.requiredFeeStake = Number(latestRound.requiredFeeStake)
  latestRound.paidFees[0] = Number(latestRound.paidFees[0])
  latestRound.paidFees[1] = Number(latestRound.paidFees[1])
  latestRound.paidFees[2] = Number(latestRound.paidFees[2])
  token.latestRound = latestRound
  return token
}

/**
 * Fetches a paginatable list of tokens.
 * @param {{ type: string, payload: ?object, meta: ?object }} action - The action object.
 * @returns {object[]} - The fetched tokens.
 */
function* fetchTokens({
  payload: { cursor, count, filterValue, sortValue, requestedPage }
}) {
  const totalCount = yield call(arbitrableTokenList.methods.tokenCount().call, {
    from: yield select(walletSelectors.getAccount)
  })

  if (requestedPage * count > totalCount) {
    // Page does not exist. Set to closest.
    requestedPage =
      totalCount % 2 === 0 ? totalCount / count : totalCount / count + 1
    requestedPage = Math.trunc(requestedPage)
  }

  if (requestedPage > 1)
    cursor = yield call(
      arbitrableTokenList.methods.tokensList(requestedPage - 1).call,
      {
        from: yield select(walletSelectors.getAccount)
      }
    )

  const data = yield call(
    arbitrableTokenList.methods.queryTokens(
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
  tokens.totalCount = Number(totalCount)
  return tokens
}

/**
 * Fetches a token from the list.
 * @param {{ type: string, payload: ?object, meta: ?object }} action - The action object.
 * @returns {object} - The fetched token.
 */
export function* fetchToken({ payload: { ID } }) {
  let token = yield call(arbitrableTokenList.methods.getTokenInfo(ID).call)

  if (Number(token.numberOfRequests > 0)) {
    token.latestRequest = yield call(
      arbitrableTokenList.methods.getRequestInfo(
        ID,
        Number(token.numberOfRequests) - 1
      ).call
    )

    if (token.latestRequest.disputed) {
      // Fetch dispute data.
      token.latestRequest.dispute = yield call(
        arbitrator.methods.disputes(token.latestRequest.disputeID).call
      )

      // Fetch appeal period and cost if in appeal period.
      if (
        token.latestRequest.dispute.status ===
          tokenConstants.DISPUTE_STATUS.Appealable.toString() &&
        !token.latestRequest.appealed
      ) {
        token.latestRequest.appealPeriod = yield call(
          arbitrator.methods.appealPeriod(token.latestRequest.disputeID).call
        )
        token.latestRequest.appealCost = yield call(
          arbitrator.methods.appealCost(token.latestRequest.disputeID, '0x0')
            .call
        )
      }
    }

    token.latestRequest.latestRound = yield call(
      arbitrableTokenList.methods.getRoundInfo(
        ID,
        Number(token.numberOfRequests) - 1,
        Number(token.latestRequest.numberOfRounds) - 1
      ).call
    )

    token = convertFromString(token)
  } else
    token.latestRequest = {
      disputed: false,
      disputeID: 0,
      dispute: null,
      firstContributionTime: 0,
      arbitrationFeesWaitingTime: 0,
      timeToChallenge: 0,
      challengeRewardBalance: 0,
      challengeReward: 0,
      parties: [],
      appealed: false,
      latestRound: {
        ruling: 0,
        requiredFeeStake: 0,
        paidFees: [],
        loserFullyFunded: false
      }
    }

  const tokenFile = yield call(storeApi.getFile, ID)
  const { URI, name } = tokenFile

  return {
    ...token,
    name,
    ID,
    URI,
    status: Number(token.status),
    clientStatus: contractStatusToClientStatus(
      token.status,
      token.latestRequest.disputed
    ),
    lastAction: token.lastAction
      ? new Date(Number(token.lastAction * 1000))
      : null
  }
}

/**
 * Requests status change.
 * @param {{ type: string, payload: ?object, meta: ?object }} action - The action object.
 * @returns {object} - The `lessdux` collection mod object for updating the list of tokens.
 */
function* requestStatusChange({ payload: { token } }) {
  if (isInvalid(token.addr))
    throw new Error('Missing address on token submit', token)

  // Upload token
  const tokenToSubmit = {
    name: token.name,
    ticker: token.ticker,
    addr: web3.utils.toChecksumAddress(token.addr),
    URI: token.URI
  }

  const { name, ticker, URI } = tokenToSubmit

  if (isInvalid(name) || isInvalid(ticker) || isInvalid(URI))
    throw new Error('Missing data on token submit', tokenToSubmit)

  const file = JSON.stringify(tokenToSubmit)
  const { payload } = yield call(
    storeApi.postFile,
    file,
    `${web3.utils.sha3(file)}`
  )

  const ID = payload.fileURL.split('/')[3].split('.')[0] // Taking tokenID from URL.
  const recentToken = yield call(fetchToken, { payload: { ID } })

  if (
    recentToken.status ===
      tokenConstants.IN_CONTRACT_STATUS_ENUM.RegistrationRequested ||
    recentToken.status ===
      tokenConstants.IN_CONTRACT_STATUS_ENUM.ClearingRequested
  )
    throw new Error(errorConstants.TOKEN_IN_WRONG_STATE)

  yield call(
    arbitrableTokenList.methods.requestStatusChange(
      ID,
      tokenToSubmit.name,
      tokenToSubmit.ticker,
      tokenToSubmit.addr
    ).send,
    {
      from: yield select(walletSelectors.getAccount),
      value: yield select(arbitrableTokenListSelectors.getSubmitCost)
    }
  )

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

  if (side === tokenConstants.SIDE.Requester)
    yield call(arbitrableTokenList.methods.fundRequester(ID).send, {
      from: yield select(walletSelectors.getAccount),
      value
    })
  else if (side === tokenConstants.SIDE.Challenger)
    yield call(arbitrableTokenList.methods.fundChallenger(ID).send, {
      from: yield select(walletSelectors.getAccount),
      value
    })
  else throw new Error(errorConstants.INVALID_SIDE)

  return yield call(fetchToken, { payload: { ID } })
}

/**
 * Fund a side of a dispute
 * @param {{ type: string, payload: ?object, meta: ?object }} action - The action object.
 * @returns {object} - The `lessdux` collection mod object for updating the list of tokens.
 */
function* fundAppeal({ payload: { ID, losingSide, value } }) {
  if (losingSide)
    yield call(arbitrableTokenList.methods.fundAppealLosingSide(ID).send, {
      from: yield select(walletSelectors.getAccount),
      value
    })
  else
    yield call(arbitrableTokenList.methods.fundAppealWinningSide(ID).send, {
      from: yield select(walletSelectors.getAccount),
      value
    })

  return yield call(fetchToken, { payload: { ID } })
}

/**
 * Execute a request for a token.
 * @param {{ type: string, payload: ?object, meta: ?object }} action - The action object.
 * @returns {object} - The `lessdux` collection mod object for updating the list of tokens.
 */
function* executeRequest({ payload: { ID } }) {
  const status = Number((yield call(fetchToken, { payload: { ID } })).status)
  if (
    status !== tokenConstants.IN_CONTRACT_STATUS_ENUM.RegistrationRequested &&
    status !== tokenConstants.IN_CONTRACT_STATUS_ENUM.ClearingRequested
  )
    throw new Error(errorConstants.TOKEN_IN_WRONG_STATE)

  yield call(arbitrableTokenList.methods.executeRequest(ID).send, {
    from: yield select(walletSelectors.getAccount)
  })

  return yield call(fetchToken, { payload: { ID } })
}

/**
 * Execute a request for a token.
 * @param {{ type: string, payload: ?object, meta: ?object }} action - The action object.
 * @returns {object} - The `lessdux` collection mod object for updating the list of tokens.
 */
function* feeTimeout({ payload: { token } }) {
  yield call(arbitrableTokenList.methods.feeTimeoutFirstRound(token.ID).send, {
    from: yield select(walletSelectors.getAccount)
  })

  return yield call(fetchToken, { payload: { ID: token.ID } })
}

/**
 * Check if a string is undefined, not a string or empty.
 * @param {string} str input string.
 * @returns {bool} Weather it passes the test.
 */
function isInvalid(str) {
  return !str || typeof str !== 'string' || str.trim().length === 0
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
    requestStatusChange
  )
  yield takeLatest(
    tokenActions.token.STATUS_CHANGE,
    lessduxSaga,
    updateTokensCollectionModFlow,
    tokenActions.token,
    requestStatusChange
  )
  yield takeLatest(
    tokenActions.token.RESUBMIT,
    lessduxSaga,
    updateTokensCollectionModFlow,
    tokenActions.token,
    requestStatusChange
  )
  yield takeLatest(
    tokenActions.token.CLEAR,
    lessduxSaga,
    updateTokensCollectionModFlow,
    tokenActions.token,
    requestStatusChange
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
  yield takeLatest(
    tokenActions.token.FEES_TIMEOUT,
    lessduxSaga,
    updateTokensCollectionModFlow,
    tokenActions.token,
    feeTimeout
  )
  yield takeLatest(
    tokenActions.token.FUND_APPEAL,
    lessduxSaga,
    updateTokensCollectionModFlow,
    tokenActions.token,
    fundAppeal
  )
}
