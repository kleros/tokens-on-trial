import { ethers } from 'ethers'

import { call, select, takeLatest } from 'redux-saga/effects'

import readFile from '../utils/read-file'
import { lessduxSaga } from '../utils/saga'
import {
  contractStatusToClientStatus,
  hasPendingRequest,
  convertFromString,
  instantiateEnvObjects
} from '../utils/tcr'
import * as tokenActions from '../actions/token'
import * as walletSelectors from '../reducers/wallet'
import * as tcrConstants from '../constants/tcr'
import * as errorConstants from '../constants/error'
import { web3Utils } from '../bootstrap/dapp-api'

import ipfsPublish from './api/ipfs-publish'

const { toBN } = web3Utils
const statusToCode = {
  Absent: '0',
  Registered: '1',
  RegistrationRequested: '2',
  ClearingRequested: '3'
}
const rulingToCode = {
  None: '0',
  Accept: '1',
  Reject: '2'
}

/**
 * Fetches a token from the list.
 * @param {{ type: string, payload: ?object, meta: ?object }} action - The action object.
 * @returns {object} - The fetched token.
 */
export function* fetchToken({ payload: { ID } }) {
  const {
    arbitrableTokenListView,
    arbitratorView,
    arbitrableTCRView,
    T2CR_SUBGRAPH_URL
  } = yield call(instantiateEnvObjects)
  const tokenResponse = yield call(fetch, T2CR_SUBGRAPH_URL, {
    method: 'POST',
    body: JSON.stringify({
      query: `
        {
          token(id: "${ID}") {
            numberOfRequests
            name
            ticker
            address
            symbolMultihash
            status
            requests {
              id
              submissionTime
              result
              type
              requester
              resolutionTime
              arbitrator
              arbitratorExtraData
              numberOfRounds
              disputed
              disputeID
              disputeOutcome
              challenger
              rounds {
                feeRewards
                hasPaidChallenger
                hasPaidRequester
                appealed
                amountPaidChallenger
                amountPaidRequester
                id
              }
            }
          }
        }
      `
    })
  })
  let tokenFromSubgraph = (yield tokenResponse.json()).data.token

  tokenFromSubgraph.status = statusToCode[tokenFromSubgraph.status]
  tokenFromSubgraph.address = web3Utils.toChecksumAddress(
    tokenFromSubgraph.address
  )
  tokenFromSubgraph.addr = web3Utils.toChecksumAddress(
    tokenFromSubgraph.address
  )
  tokenFromSubgraph.requests = tokenFromSubgraph.requests.map((req, i) => ({
    ...req,
    arbitrator: web3Utils.toChecksumAddress(req.arbitrator),
    requester: web3Utils.toChecksumAddress(req.requester),
    challenger: web3Utils.toChecksumAddress(req.challenger),
    resolved: req.resolutionTime !== '0',
    ruling: rulingToCode[req.disputeOutcome],
    evidenceGroupID: web3Utils.toBN(web3Utils.soliditySha3(ID, i)).toString(),
    rounds: req.rounds.map(round => ({
      ...round,
      hasPaid: [false, round.hasPaidRequester, round.hasPaidChallenger],
      paidFees: [
        web3Utils.toBN(0),
        web3Utils.toBN(round.amountPaidRequester),
        web3Utils.toBN(round.amountPaidChallenger)
      ]
    }))
  }))
  tokenFromSubgraph.latestRequest =
    tokenFromSubgraph.requests[tokenFromSubgraph.requests.length - 1]
  tokenFromSubgraph.latestRound =
    tokenFromSubgraph.latestRequest.rounds[
      tokenFromSubgraph.latestRequest.rounds.length - 1
    ]
  tokenFromSubgraph.withdrawable = web3Utils.toBN(0)
  tokenFromSubgraph.submissionTime = tokenFromSubgraph.submissionTime * 1000
  tokenFromSubgraph.feeRewards = tokenFromSubgraph.latestRound.feeRewards

  const account = yield select(walletSelectors.getAccount)
  if (account) {
    // Calculate amount withdrawable
    let i
    if (tokenFromSubgraph.latestRequest.resolved)
      i = tokenFromSubgraph.numberOfRequests - 1
    // Start from the last round.
    else if (tokenFromSubgraph.numberOfRequests > 1)
      i = tokenFromSubgraph.numberOfRequests - 2 // Start from the penultimate round.

    while (i >= 0) {
      const amount = yield call(
        arbitrableTokenListView.methods.amountWithdrawable(ID, account, i).call
      )
      tokenFromSubgraph.withdrawable = tokenFromSubgraph.withdrawable.add(
        web3Utils.toBN(amount)
      )
      i--
    }
  }

  tokenFromSubgraph.latestRequest = {
    ...tokenFromSubgraph.latestRequest,
    ...(yield call(
      arbitrableTCRView.methods.getRequestDetails(
        arbitrableTokenListView.options.address,
        ID,
        Number(tokenFromSubgraph.numberOfRequests) - 1
      ).call
    ))
  }
  tokenFromSubgraph.latestRequest = {
    ...tokenFromSubgraph.latestRequest,
    arbitratorExtraData:
      tokenFromSubgraph.latestRequest.arbitratorExtraData || '0x', // Workaround web3js bug. Web3js returns null if extra data is '0x'
    submissionTime: Number(tokenFromSubgraph.latestRequest.submissionTime),
    appealCost: String(tokenFromSubgraph.latestRequest.appealCost),
    appealPeriod: tokenFromSubgraph.latestRequest.appealPeriod[0] !== '0' &&
      tokenFromSubgraph.latestRequest.appealPeriod[1] !== '0' && {
        0: tokenFromSubgraph.latestRequest.appealPeriod[0],
        1: tokenFromSubgraph.latestRequest.appealPeriod[1],
        start: tokenFromSubgraph.latestRequest.appealPeriod[0],
        end: tokenFromSubgraph.latestRequest.appealPeriod[1]
      },
    requiredForSide: [
      toBN(0),
      toBN(tokenFromSubgraph.latestRequest.requiredForSide[1]),
      toBN(tokenFromSubgraph.latestRequest.requiredForSide[2])
    ]
  }

  if (Number(tokenFromSubgraph.numberOfRequests > 0)) {
    tokenFromSubgraph.latestRequest.latestRound = {
      appealCost: tokenFromSubgraph.latestRequest.appealCost,
      appealPeriod: tokenFromSubgraph.latestRequest.appealPeriod,
      appealed:
        tokenFromSubgraph.latestRequest.hasPaid[1] &&
        tokenFromSubgraph.latestRequest.hasPaid[2],
      paidFees: tokenFromSubgraph.latestRequest.paidFees.map(pf =>
        web3Utils.toBN(pf)
      ),
      requiredForSide: tokenFromSubgraph.latestRequest.requiredForSide,
      hasPaid: tokenFromSubgraph.latestRequest.hasPaid
    }

    if (tokenFromSubgraph.latestRequest.disputed) {
      // Fetch dispute data.
      arbitratorView.options.address =
        tokenFromSubgraph.latestRequest.arbitrator
      try {
        tokenFromSubgraph.latestRequest.dispute = yield call(
          arbitratorView.methods.disputes(
            tokenFromSubgraph.latestRequest.disputeID
          ).call
        )
        tokenFromSubgraph.latestRequest.dispute.court = yield call(
          arbitratorView.methods.getSubcourt(
            tokenFromSubgraph.latestRequest.dispute.subcourtID
          ).call
        )
      } catch (err) {
        // Arbitrator does not implement getSubcourt (i.e. its probably not Kleros).
        console.warn(`Arbitrator is not kleros, cannot get court info`, err)
        // No op, just ignore the field.
        tokenFromSubgraph.latestRequest.dispute = {}
      }

      tokenFromSubgraph.latestRequest.dispute.status =
        tokenFromSubgraph.latestRequest.disputeStatus
      tokenFromSubgraph.latestRequest.dispute.currentRuling =
        tokenFromSubgraph.latestRequest.currentRuling
      tokenFromSubgraph.latestRequest.dispute.ruling =
        tokenFromSubgraph.latestRequest.dispute.currentRuling
      tokenFromSubgraph.latestRequest.appealDisputeID =
        tokenFromSubgraph.latestRequest.disputeID
      tokenFromSubgraph.latestRequest.dispute.appealStatus =
        tokenFromSubgraph.latestRequest.dispute.status
      tokenFromSubgraph.latestRequest.latestRound.appealCost = toBN(
        tokenFromSubgraph.latestRequest.appealCost
      )
      tokenFromSubgraph.latestRequest.latestRound.requiredForSide =
        tokenFromSubgraph.latestRequest.requiredForSide
      tokenFromSubgraph.latestRequest.latestRound.appealPeriod =
        tokenFromSubgraph.latestRequest.appealPeriod
    }

    tokenFromSubgraph.latestRequest.latestRound.ruled =
      tokenFromSubgraph.latestRequest.dispute &&
      tokenFromSubgraph.latestRequest.dispute.status ===
        tcrConstants.DISPUTE_STATUS.Solved

    tokenFromSubgraph = convertFromString(tokenFromSubgraph)
  } else
    tokenFromSubgraph = {
      status: 0,
      latestRequest: {
        disputed: false,
        disputeID: 0,
        dispute: null,
        submissionTime: 0,
        feeRewards: 0,
        pot: [],
        resolved: false,
        parties: [],
        latestRound: {
          appealed: false,
          paidFees: new Array(3).fill(web3Utils.toBN(0)),
          requiredForSide: new Array(3).fill(web3Utils.toBN(0))
        }
      },
      numberOfRequests: 0
    }

  return {
    ...tokenFromSubgraph,
    ID,
    status: Number(tokenFromSubgraph.status),
    clientStatus: contractStatusToClientStatus(
      tokenFromSubgraph.status,
      tokenFromSubgraph.latestRequest.disputed
    )
  }
}

/**
 * Request registration
 * @param {{ type: string, payload: ?object, meta: ?object }} action - The action object.
 * @returns {object} - The `lessdux` collection mod object for updating the list of tokens.
 */
function* requestRegistration({ payload: { token, file, fileData, value } }) {
  const { arbitrableTokenList } = yield call(instantiateEnvObjects)

  const tokenToSubmit = {
    name: token.name,
    ticker: token.ticker,
    address: web3Utils.toChecksumAddress(token.address),
    symbolMultihash: token.symbolMultihash
  }

  if (file && fileData) {
    /* eslint-disable unicorn/number-literal-case */
    const data = yield call(readFile, file.preview)
    try {
      const ipfsFileObj = yield call(ipfsPublish, token.ticker, data)
      tokenToSubmit.symbolMultihash = `/ipfs/${ipfsFileObj[1].hash}${
        ipfsFileObj[0].path
      }`
    } catch (err) {
      throw new Error('Failed to upload token image', err)
    }
  }

  const { name, ticker, address, symbolMultihash } = tokenToSubmit

  if (isInvalid(name) || isInvalid(ticker) || isInvalid(symbolMultihash))
    throw new Error('Missing data on token submit', tokenToSubmit)

  const ID = ethers.utils.solidityKeccak256(
    ['string', 'string', 'address', 'string'],
    [name || '', ticker || '', address, symbolMultihash]
  )

  const recentToken = yield call(fetchToken, { payload: { ID } })

  if (recentToken.status !== tcrConstants.IN_CONTRACT_STATUS_ENUM.Absent)
    throw new Error(errorConstants.TOKEN_IN_WRONG_STATE)

  yield call(
    arbitrableTokenList.methods.requestStatusChange(
      tokenToSubmit.name,
      tokenToSubmit.ticker,
      tokenToSubmit.address,
      tokenToSubmit.symbolMultihash
    ).send,
    {
      from: yield select(walletSelectors.getAccount),
      value
    }
  )

  return yield call(fetchToken, { payload: { ID } })
}

/**
 * Requests status change.
 * @param {{ type: string, payload: ?object, meta: ?object }} action - The action object.
 * @returns {object} - The `lessdux` collection mod object for updating the list of tokens.
 */
function* requestStatusChange({ payload: { token, file, fileData, value } }) {
  if (isInvalid(token.ID) && isInvalid(token.address))
    throw new Error('Missing address on token submit', token)

  const { arbitrableTokenList } = yield call(instantiateEnvObjects)

  const tokenToSubmit = {
    name: token.name,
    ticker: token.ticker,
    address: web3Utils.toChecksumAddress(token.address),
    symbolMultihash: token.symbolMultihash
  }

  if (file && fileData) {
    /* eslint-disable unicorn/number-literal-case */
    const data = yield call(readFile, file.preview)
    try {
      const ipfsFileObj = yield call(ipfsPublish, 'evidence.json', data)
      tokenToSubmit.symbolMultihash = `/ipfs/${ipfsFileObj[1].hash}${
        ipfsFileObj[0].path
      }`
    } catch (err) {
      throw new Error('Failed to upload token image', err)
    }
  }

  const { name, ticker, address, symbolMultihash } = tokenToSubmit

  if (isInvalid(name) || isInvalid(ticker) || isInvalid(symbolMultihash))
    throw new Error('Missing data on token submit', tokenToSubmit)

  const ID = web3Utils.soliditySha3(
    name || '',
    ticker || '',
    address,
    symbolMultihash
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
      tokenToSubmit.address,
      tokenToSubmit.symbolMultihash
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
function* challengeRequest({ payload: { ID, value, evidence } }) {
  const { arbitrableTokenList } = yield call(instantiateEnvObjects)

  // Add to contract if absent
  const token = yield call(fetchToken, { payload: { ID } })
  if (!hasPendingRequest(token))
    throw new Error(errorConstants.NO_PENDING_REQUEST)

  yield call(arbitrableTokenList.methods.challengeRequest(ID, evidence).send, {
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
  const { arbitrableTokenList } = yield call(instantiateEnvObjects)

  // Add to contract if absent
  const token = yield call(fetchToken, { payload: { ID } })
  if (!hasPendingRequest(token))
    throw new Error(errorConstants.NO_PENDING_REQUEST)

  yield call(arbitrableTokenList.methods.fundAppeal(ID, side).send, {
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
  const { arbitrableTokenList } = yield call(instantiateEnvObjects)

  yield call(arbitrableTokenList.methods.fundAppeal(ID, side).send, {
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
  const { arbitrableTokenList } = yield call(instantiateEnvObjects)
  if (
    status !== tcrConstants.IN_CONTRACT_STATUS_ENUM.RegistrationRequested &&
    status !== tcrConstants.IN_CONTRACT_STATUS_ENUM.ClearingRequested
  )
    throw new Error(errorConstants.TOKEN_IN_WRONG_STATE)

  yield call(arbitrableTokenList.methods.executeRequest(ID).send, {
    from: yield select(walletSelectors.getAccount)
  })

  return yield call(fetchToken, { payload: { ID } })
}

/**
 * Timeout challenger.
 * @param {{ type: string, payload: ?object, meta: ?object }} action - The action object.
 * @returns {object} - The `lessdux` collection mod object for updating the token.
 */
function* feeTimeout({ payload: { token } }) {
  const { arbitrableTokenList } = yield call(instantiateEnvObjects)

  yield call(arbitrableTokenList.methods.executeRequest(token.ID).send, {
    from: yield select(walletSelectors.getAccount)
  })

  return yield call(fetchToken, { payload: { ID: token.ID } })
}

/**
 * Withdraw funds from token's latest request.
 * @param {{ type: string, payload: ?object, meta: ?object }} action - The action object.
 * @returns {object} - The `lessdux` collection mod object for updating the token object.
 */
function* withdrawTokenFunds({ payload: { ID, item } }) {
  let count = 5
  if (!item.latestRequest.resolved) count = item.numberOfRequests - 2
  const { arbitrableTokenList } = yield call(instantiateEnvObjects)

  yield call(
    arbitrableTokenList.methods.batchRequestWithdraw(
      yield select(walletSelectors.getAccount),
      ID,
      0,
      count,
      0,
      0
    ).send,
    { from: yield select(walletSelectors.getAccount) }
  )

  return yield call(fetchToken, { payload: { ID } })
}

/**
 * Check if a string is undefined, not a string or empty.
 * @param {string} str input string.
 * @returns {bool} Weather it passes the test.
 */
function isInvalid(str) {
  return str === null || typeof str !== 'string'
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
    requestRegistration
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
    requestRegistration
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
  yield takeLatest(
    tokenActions.token.CHALLENGE_REQUEST,
    lessduxSaga,
    updateTokensCollectionModFlow,
    tokenActions.token,
    challengeRequest
  )
  yield takeLatest(
    tokenActions.token.WITHDRAW,
    lessduxSaga,
    updateTokensCollectionModFlow,
    tokenActions.token,
    withdrawTokenFunds
  )
}
