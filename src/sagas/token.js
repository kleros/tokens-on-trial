import * as mime from 'mime-types'

import { all, call, select, takeLatest } from 'redux-saga/effects'

import { lessduxSaga } from '../utils/saga'
import {
  arbitrableTokenList,
  arbitrableAddressList,
  arbitrator,
  archon,
  web3
} from '../bootstrap/dapp-api'
import {
  contractStatusToClientStatus,
  hasPendingRequest,
  convertFromString
} from '../utils/tcr'
import * as tokenActions from '../actions/token'
import * as walletSelectors from '../reducers/wallet'
import * as tcrConstants from '../constants/tcr'
import * as errorConstants from '../constants/error'

import storeApi from './api/store'

const ZERO_ID =
  '0x0000000000000000000000000000000000000000000000000000000000000000'
const ZERO_ADDR = '0x0000000000000000000000000000000000000000'

/**
 * Fetches a paginatable list of tokens.
 * @param {{ type: string, payload: ?object, meta: ?object }} action - The action object.
 * @returns {object[]} - The fetched tokens.
 */
function* fetchTokens({ payload: { cursor, count, filterValue, sortValue } }) {
  // Token count and stats
  if (cursor === '') cursor = ZERO_ID

  const totalCount = Number(
    yield call(arbitrableTokenList.methods.tokenCount().call, {
      from: yield select(walletSelectors.getAccount)
    })
  )
  const totalPages =
    totalCount <= count
      ? 1
      : totalCount % count === 0
      ? totalCount / count
      : Math.floor(totalCount / count) + 1

  let countByStatus = yield call(
    arbitrableTokenList.methods.countByStatus().call,
    {
      from: yield select(walletSelectors.getAccount)
    }
  )

  countByStatus = {
    '0': Number(countByStatus['0']),
    '1': Number(countByStatus['1']),
    '2': Number(countByStatus['2']),
    '3': Number(countByStatus['3']),
    '4': Number(countByStatus['4']),
    '5': Number(countByStatus['5']),
    absent: Number(countByStatus['absent']),
    challengedClearingRequest: Number(
      countByStatus['challengedClearingRequest']
    ),
    challengedRegistrationRequest: Number(
      countByStatus['challengedRegistrationRequest']
    ),
    clearingRequest: Number(countByStatus['clearingRequest']),
    registered: Number(countByStatus['registered']),
    registrationRequest: Number(countByStatus['registrationRequest'])
  }

  // Fetch first and last tokens
  const firstToken = yield call(
    arbitrableTokenList.methods.tokensList(0).call,
    { from: yield select(walletSelectors.getAccount) }
  )
  const lastToken = yield call(
    arbitrableTokenList.methods.tokensList(totalCount - 1).call,
    { from: yield select(walletSelectors.getAccount) }
  )

  // Get last page
  let lastPage
  /* eslint-disable no-unused-vars */
  try {
    const lastTokens = yield call(
      arbitrableTokenList.methods.queryTokens(
        lastToken,
        count,
        filterValue,
        false,
        ZERO_ADDR
      ).call,
      { from: yield select(walletSelectors.getAccount) }
    )
    lastPage = lastTokens.values.filter(ID => ID !== ZERO_ID)[
      lastTokens.values.length - 1
    ]
  } catch (err) {
    lastPage = '' // No op. There are no previous tokens.
  }
  /* eslint-enable */

  // Get current page
  let currentPage = 1
  if (cursor !== firstToken && cursor !== ZERO_ID) {
    const itemsBefore = (yield call(
      arbitrableTokenList.methods.queryTokens(
        cursor === firstToken ? ZERO_ID : cursor,
        1000,
        filterValue,
        false,
        ZERO_ADDR
      ).call,
      { from: yield select(walletSelectors.getAccount) }
    )).values.filter(ID => ID !== ZERO_ID).length

    currentPage =
      itemsBefore <= count
        ? 2
        : itemsBefore % count === 0
        ? itemsBefore / count + 1
        : Math.floor(itemsBefore / count) + 2
  }

  // Fetch tokens
  const data = yield call(
    arbitrableTokenList.methods.queryTokens(
      cursor === firstToken ? ZERO_ID : cursor,
      count,
      filterValue,
      sortValue,
      ZERO_ADDR
    ).call,
    { from: yield select(walletSelectors.getAccount) }
  )

  const tokenIDs = data.values.filter(ID => ID !== ZERO_ID)
  const tokens = yield all(
    tokenIDs.map(ID => call(fetchToken, { payload: { ID } }))
  )

  // Fetch previous page token ID
  /* eslint-disable no-unused-vars */
  let previousPage
  try {
    const previousTokens = yield call(
      arbitrableTokenList.methods.queryTokens(
        tokenIDs[0],
        count + 1,
        filterValue,
        !sortValue,
        ZERO_ADDR
      ).call,
      { from: yield select(walletSelectors.getAccount) }
    )
    previousPage = previousTokens.values.filter(ID => ID !== ZERO_ID)[
      previousTokens.values.length - 1
    ]
  } catch (err) {
    previousPage = '' // No op. There are no previous tokens.
  }
  /* eslint-enable */

  tokens.hasMore = data.hasMore
  tokens.totalCount = totalCount
  tokens.countByStatus = countByStatus
  tokens.previousPage = previousPage
  tokens.lastPage = lastPage
  tokens.totalPages = totalPages
  tokens.currentPage = currentPage
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

    token.latestRequest.latestRound = yield call(
      arbitrableTokenList.methods.getRoundInfo(
        ID,
        Number(token.numberOfRequests) - 1,
        Number(token.latestRequest.numberOfRounds) - 1
      ).call
    )

    if (token.latestRequest.disputed) {
      // Fetch dispute data.
      token.latestRequest.dispute = yield call(
        arbitrator.methods.disputes(token.latestRequest.disputeID).call
      )
      token.latestRequest.dispute.status = yield call(
        arbitrator.methods.disputeStatus(token.latestRequest.disputeID).call
      )

      // Fetch appeal disputeID, if there was an appeal.
      if (Number(token.latestRequest.numberOfRounds) > 1) {
        token.latestRequest.appealDisputeID = token.latestRequest.disputeID
        token.latestRequest.dispute.appealStatus =
          token.latestRequest.dispute.status
      } else token.latestRequest.appealDisputeID = 0

      // Fetch appeal period and cost if in appeal period.
      if (
        token.latestRequest.dispute.status ===
          tcrConstants.DISPUTE_STATUS.Appealable.toString() &&
        !token.latestRequest.latestRound.appealed
      ) {
        token.latestRequest.latestRound.appealCost = yield call(
          arbitrator.methods.appealCost(token.latestRequest.disputeID, '0x0')
            .call
        )

        token.latestRequest.latestRound.appealPeriod = yield call(
          arbitrator.methods.appealPeriod(token.latestRequest.disputeID).call
        )
      }
    }

    const { addr } = token
    let badge = yield call(
      arbitrableAddressList.methods.getAddressInfo(addr).call
    )

    if (Number(badge.numberOfRequests > 0)) {
      badge.latestRequest = yield call(
        arbitrableAddressList.methods.getRequestInfo(
          addr,
          Number(badge.numberOfRequests) - 1
        ).call
      )

      badge.latestRequest.latestRound = yield call(
        arbitrableAddressList.methods.getRoundInfo(
          addr,
          Number(badge.numberOfRequests) - 1,
          Number(badge.latestRequest.numberOfRounds) - 1
        ).call
      )

      if (badge.latestRequest.disputed) {
        // Fetch dispute data.
        badge.latestRequest.dispute = yield call(
          arbitrator.methods.disputes(badge.latestRequest.disputeID).call
        )
        badge.latestRequest.dispute.status = yield call(
          arbitrator.methods.disputeStatus(badge.latestRequest.disputeID).call
        )

        // Fetch appeal disputeID, if there was an appeal.
        if (Number(badge.latestRequest.numberOfRounds) > 1) {
          badge.latestRequest.appealDisputeID = badge.latestRequest.disputeID
          badge.latestRequest.dispute.appealStatus =
            badge.latestRequest.dispute.status
        } else token.latestRequest.appealDisputeID = 0

        // Fetch appeal period and cost if in appeal period.
        if (
          badge.latestRequest.dispute.status ===
            tcrConstants.DISPUTE_STATUS.Appealable.toString() &&
          !badge.latestRequest.latestRound.appealed
        ) {
          badge.latestRequest.latestRound.appealCost = yield call(
            arbitrator.methods.appealCost(badge.latestRequest.disputeID, '0x0')
              .call
          )

          badge.latestRequest.latestRound.appealPeriod = yield call(
            arbitrator.methods.appealPeriod(badge.latestRequest.disputeID).call
          )
        }
      }

      badge = convertFromString(badge)
    } else
      badge.latestRequest = {
        disputed: false,
        disputeID: 0,
        appealDisputeID: 0,
        dispute: null,
        submissionTime: 0,
        challengeRewardBalance: 0,
        challengerDepositTime: 0,
        feeRewards: 0,
        pot: [],
        resolved: false,
        parties: [],
        latestRound: {
          appealed: false,
          paidFees: [],
          requiredForSide: []
        }
      }

    token.badge = {
      ...badge,
      status: Number(badge.status),
      clientStatus: contractStatusToClientStatus(
        badge.status,
        badge.latestRequest.disputed,
        badge.latestRequest.resolved
      )
    }

    token = convertFromString(token)
  } else
    token.latestRequest = {
      disputed: false,
      disputeID: 0,
      dispute: null,
      badge: null,
      submissionTime: 0,
      challengeRewardBalance: 0,
      challengerDepositTime: 0,
      feeRewards: 0,
      pot: [],
      resolved: false,
      parties: [],
      latestRound: {
        appealed: false,
        paidFees: [],
        requiredForSide: []
      }
    }

  return {
    ...token,
    ID,
    status: Number(token.status),
    clientStatus: contractStatusToClientStatus(
      token.status,
      token.latestRequest.disputed,
      token.latestRequest.resolved
    )
  }
}

/**
 * Requests status change.
 * @param {{ type: string, payload: ?object, meta: ?object }} action - The action object.
 * @returns {object} - The `lessdux` collection mod object for updating the list of tokens.
 */
function* requestStatusChange({ payload: { token, file, fileData, value } }) {
  if (isInvalid(token.ID) && isInvalid(token.addr))
    throw new Error('Missing address on token submit', token)

  const tokenToSubmit = {
    name: token.name,
    ticker: token.ticker,
    addr: web3.utils.toChecksumAddress(token.addr),
    symbolMultihash: token.symbolMultihash,
    networkID: 'ETH'
  }

  if (file && fileData) {
    /* eslint-disable unicorn/number-literal-case */
    const fileMultihash = archon.utils.multihashFile(fileData, 0x1b) // keccak-256
    const fileTypeExtension = file.name.split('.')[1]
    const mimeType = mime.lookup(fileTypeExtension)
    yield call(storeApi.postEncodedFile, fileData, fileMultihash, mimeType)
    tokenToSubmit.symbolMultihash = fileMultihash
  }

  const { name, ticker, addr, symbolMultihash, networkID } = tokenToSubmit

  if (isInvalid(name) || isInvalid(ticker) || isInvalid(symbolMultihash))
    throw new Error('Missing data on token submit', tokenToSubmit)

  const ID = web3.utils.soliditySha3(
    name,
    ticker,
    addr,
    symbolMultihash,
    networkID
  )
  const recentToken = yield call(fetchToken, { payload: { ID } })

  if (
    recentToken.status ===
      tcrConstants.IN_CONTRACT_STATUS_ENUM.RegistrationRequested ||
    recentToken.status ===
      tcrConstants.IN_CONTRACT_STATUS_ENUM.ClearingRequested
  )
    throw new Error(errorConstants.TOKEN_IN_WRONG_STATE)

  yield call(
    arbitrableTokenList.methods.requestStatusChange(
      tokenToSubmit.name,
      tokenToSubmit.ticker,
      tokenToSubmit.addr,
      tokenToSubmit.symbolMultihash,
      tokenToSubmit.networkID
    ).send,
    {
      from: yield select(walletSelectors.getAccount),
      value
    }
  )

  return yield call(fetchToken, { payload: { ID } })
}

/**
 * Challenge request.
 * @param {{ type: string, payload: ?object, meta: ?object }} action - The action object.
 * @returns {object} - The `lessdux` collection mod object for updating the list of tokens.
 */
function* challengeRequest({ payload: { ID, value } }) {
  // Add to contract if absent
  const token = yield call(fetchToken, { payload: { ID } })
  if (!hasPendingRequest(token))
    throw new Error(errorConstants.NO_PENDING_REQUEST)

  yield call(arbitrableTokenList.methods.challengeRequest(ID).send, {
    from: yield select(walletSelectors.getAccount),
    value
  })

  return yield call(fetchToken, { payload: { ID } })
}

/**
 * Fund a side of a dispute.
 * @param {{ type: string, payload: ?object, meta: ?object }} action - The action object.
 * @returns {object} - The `lessdux` collection mod object for updating the list of tokens.
 */
function* fundDispute({ payload: { ID, value, side } }) {
  // Add to contract if absent
  const token = yield call(fetchToken, { payload: { ID } })
  if (!hasPendingRequest(token))
    throw new Error(errorConstants.NO_PENDING_REQUEST)

  yield call(arbitrableTokenList.methods.fundLatestRound(ID, side).send, {
    from: yield select(walletSelectors.getAccount),
    value
  })

  return yield call(fetchToken, { payload: { ID } })
}

/**
 * Fund a side of a dispute
 * @param {{ type: string, payload: ?object, meta: ?object }} action - The action object.
 * @returns {object} - The `lessdux` collection mod object for updating the list of tokens.
 */
function* fundAppeal({ payload: { ID, side, value } }) {
  yield call(arbitrableTokenList.methods.fundLatestRound(ID, side).send, {
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
function* timeout({ payload: { ID } }) {
  const status = Number((yield call(fetchToken, { payload: { ID } })).status)
  if (
    status !== tcrConstants.IN_CONTRACT_STATUS_ENUM.RegistrationRequested &&
    status !== tcrConstants.IN_CONTRACT_STATUS_ENUM.ClearingRequested
  )
    throw new Error(errorConstants.TOKEN_IN_WRONG_STATE)

  yield call(arbitrableTokenList.methods.timeout(ID).send, {
    from: yield select(walletSelectors.getAccount)
  })

  return yield call(fetchToken, { payload: { ID } })
}

/**
 * Timeout challenger.
 * @param {{ type: string, payload: ?object, meta: ?object }} action - The action object.
 * @returns {object} - The `lessdux` collection mod object for updating the list of tokens.
 */
function* feeTimeout({ payload: { token } }) {
  yield call(arbitrableTokenList.methods.timeout(token.ID).send, {
    from: yield select(walletSelectors.getAccount)
  })

  return yield call(fetchToken, { payload: { ID: token.ID } })
}

/* Badge function generators */

/**
 * Requests status change.
 * @param {{ type: string, payload: ?object, meta: ?object }} action - The action object.
 * @returns {object} - The `lessdux` collection mod object for updating the list of tokens.
 */
function* requestStatusChangeBadge({ payload: { token, value } }) {
  if (isInvalid(token.addr))
    throw new Error('Missing address on token submit', token)

  yield call(
    arbitrableAddressList.methods.requestStatusChange(token.addr).send,
    {
      from: yield select(walletSelectors.getAccount),
      value
    }
  )

  const { ID } = token
  return yield call(fetchToken, { payload: { ID } })
}

/**
 * Challenge request.
 * @param {{ type: string, payload: ?object, meta: ?object }} action - The action object.
 * @returns {object} - The `lessdux` collection mod object for updating the list of tokens.
 */
function* challengeBadgeRequest({ payload: { addr, ID, value } }) {
  yield call(arbitrableAddressList.methods.challengeRequest(addr).send, {
    from: yield select(walletSelectors.getAccount),
    value
  })

  return yield call(fetchToken, { payload: { ID } })
}

/**
 * Fund a side of a dispute.
 * @param {{ type: string, payload: ?object, meta: ?object }} action - The action object.
 * @returns {object} - The `lessdux` collection mod object for updating the list of tokens.
 */
function* fundBadgeDispute({ payload: { addr, ID, side, value } }) {
  yield call(arbitrableAddressList.methods.fundLatestRound(addr, side).send, {
    from: yield select(walletSelectors.getAccount),
    value
  })

  return yield call(fetchToken, { payload: { ID } })
}

/**
 * Fund a side of a dispute
 * @param {{ type: string, payload: ?object, meta: ?object }} action - The action object.
 * @returns {object} - The `lessdux` collection mod object for updating the list of tokens.
 */
function* fundBadgeAppeal({ payload: { addr, ID, side, value } }) {
  yield call(arbitrableAddressList.methods.fundLatestRound(addr, side).send, {
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
function* badgeTimeout({ payload: { token } }) {
  yield call(arbitrableAddressList.methods.timeout(token.addr).send, {
    from: yield select(walletSelectors.getAccount)
  })

  const { ID } = token
  return yield call(fetchToken, { payload: { ID } })
}

/**
 * Timeout challenger.
 * @param {{ type: string, payload: ?object, meta: ?object }} action - The action object.
 * @returns {object} - The `lessdux` collection mod object for updating the list of tokens.
 */
function* feeTimeoutBadge({ payload: { token } }) {
  yield call(arbitrableAddressList.methods.timeout(token.addr).send, {
    from: yield select(walletSelectors.getAccount)
  })

  const { ID } = token
  return yield call(fetchToken, { payload: { ID } })
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
    timeout
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
  yield takeLatest(
    tokenActions.token.CHALLENGE_REQUEST,
    lessduxSaga,
    updateTokensCollectionModFlow,
    tokenActions.token,
    challengeRequest
  )

  // Badges
  yield takeLatest(
    tokenActions.token.CREATE_BADGE,
    lessduxSaga,
    updateTokensCollectionModFlow,
    tokenActions.token,
    requestStatusChangeBadge
  )
  yield takeLatest(
    tokenActions.token.STATUS_CHANGE_BADGE,
    lessduxSaga,
    updateTokensCollectionModFlow,
    tokenActions.token,
    requestStatusChangeBadge
  )
  yield takeLatest(
    tokenActions.token.RESUBMIT_BADGE,
    lessduxSaga,
    updateTokensCollectionModFlow,
    tokenActions.token,
    requestStatusChangeBadge
  )
  yield takeLatest(
    tokenActions.token.CLEAR_BADGE,
    lessduxSaga,
    updateTokensCollectionModFlow,
    tokenActions.token,
    requestStatusChangeBadge
  )
  yield takeLatest(
    tokenActions.token.EXECUTE_BADGE,
    lessduxSaga,
    updateTokensCollectionModFlow,
    tokenActions.token,
    badgeTimeout
  )
  yield takeLatest(
    tokenActions.token.FUND_DISPUTE_BADGE,
    lessduxSaga,
    updateTokensCollectionModFlow,
    tokenActions.token,
    fundBadgeDispute
  )
  yield takeLatest(
    tokenActions.token.FEES_TIMEOUT_BADGE,
    lessduxSaga,
    updateTokensCollectionModFlow,
    tokenActions.token,
    feeTimeoutBadge
  )
  yield takeLatest(
    tokenActions.token.FUND_APPEAL_BADGE,
    lessduxSaga,
    updateTokensCollectionModFlow,
    tokenActions.token,
    fundBadgeAppeal
  )
  yield takeLatest(
    tokenActions.token.CHALLENGE_REQUEST_BADGE,
    lessduxSaga,
    updateTokensCollectionModFlow,
    tokenActions.token,
    challengeBadgeRequest
  )
}
