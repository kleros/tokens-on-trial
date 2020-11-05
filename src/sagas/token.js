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

/**
 * Fetches a token from the list.
 * @param {{ type: string, payload: ?object, meta: ?object }} action - The action object.
 * @returns {object} - The fetched token.
 */
export function* fetchToken({ payload: { ID } }) {
  const { arbitrableTokenListView, arbitratorView } = yield call(
    instantiateEnvObjects
  )

  let token = yield call(arbitrableTokenListView.methods.getTokenInfo(ID).call)
  token.address = token.addr
  const account = yield select(walletSelectors.getAccount)

  // web3js returns null if a string value in the smart contract is "0x".
  if (token.name === null || token['0'] === null) {
    token.name = '0x'
    token['0'] = '0x'
  }

  if (token.ticker === null || token['1'] === null) {
    token.ticker = '0x'
    token['1'] = '0x'
  }

  token.requests = []
  if (Number(token.numberOfRequests > 0)) {
    for (let i = 0; i < token.numberOfRequests; i++) {
      const request = yield call(
        arbitrableTokenListView.methods.getRequestInfo(ID, i).call
      )
      if (request.arbitratorExtraData === null)
        request.arbitratorExtraData = '0x' // Workaround web3js bug. Web3js returns null if extra data is '0x'

      request.evidenceGroupID = web3Utils
        .toBN(web3Utils.soliditySha3(ID, i))
        .toString()

      token.requests.push(request)
    }

    token.latestRequest = token.requests[token.requests.length - 1]

    // Calculate amount withdrawable
    let i
    token.withdrawable = web3Utils.toBN(0)
    if (token.latestRequest.resolved) i = token.numberOfRequests - 1
    // Start from the last round.
    else if (token.numberOfRequests > 1) i = token.numberOfRequests - 2 // Start from the penultimate round.

    if (account)
      while (i >= 0) {
        const amount = yield call(
          arbitrableTokenListView.methods.amountWithdrawable(ID, account, i)
            .call
        )
        token.withdrawable = token.withdrawable.add(web3Utils.toBN(amount))
        i--
      }

    token.latestRequest.latestRound = yield call(
      arbitrableTokenListView.methods.getRoundInfo(
        ID,
        Number(token.numberOfRequests) - 1,
        Number(token.latestRequest.numberOfRounds) - 1
      ).call
    )

    token.latestRequest.latestRound.paidFees[0] = toBN(
      token.latestRequest.latestRound.paidFees[0]
    )
    token.latestRequest.latestRound.paidFees[1] = toBN(
      token.latestRequest.latestRound.paidFees[1]
    )
    token.latestRequest.latestRound.paidFees[2] = toBN(
      token.latestRequest.latestRound.paidFees[2]
    )

    if (token.latestRequest.disputed) {
      // Fetch dispute data.
      arbitratorView.options.address = token.latestRequest.arbitrator
      token.latestRequest.dispute = yield call(
        arbitratorView.methods.disputes(token.latestRequest.disputeID).call
      )
      token.latestRequest.dispute.court = yield call(
        arbitratorView.methods.getSubcourt(
          token.latestRequest.dispute.subcourtID
        ).call
      )
      token.latestRequest.dispute.status = yield call(
        arbitratorView.methods.disputeStatus(token.latestRequest.disputeID).call
      )
      token.latestRequest.dispute.ruling = yield call(
        arbitratorView.methods.currentRuling(token.latestRequest.disputeID).call
      )

      // Fetch appeal disputeID, if there was an appeal.
      if (Number(token.latestRequest.numberOfRounds) > 2) {
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
          arbitratorView.methods.appealCost(
            token.latestRequest.disputeID,
            token.latestRequest.arbitratorExtraData
          ).call
        )
        const MULTIPLIER_DIVISOR = yield call(
          arbitrableTokenListView.methods.MULTIPLIER_DIVISOR().call
        )
        const winnerStakeMultiplier = yield call(
          arbitrableTokenListView.methods.winnerStakeMultiplier().call
        )
        const loserStakeMultiplier = yield call(
          arbitrableTokenListView.methods.loserStakeMultiplier().call
        )
        const sharedStakeMultiplier = yield call(
          arbitrableTokenListView.methods.sharedStakeMultiplier().call
        )
        token.latestRequest.latestRound.requiredForSide = [toBN(0)]

        const ruling = Number(token.latestRequest.dispute.ruling)
        if (ruling === 0) {
          token.latestRequest.latestRound.requiredForSide.push(
            toBN(token.latestRequest.latestRound.appealCost).add(
              toBN(token.latestRequest.latestRound.appealCost)
                .mul(toBN(sharedStakeMultiplier))
                .div(toBN(MULTIPLIER_DIVISOR))
            )
          )
          token.latestRequest.latestRound.requiredForSide.push(
            toBN(token.latestRequest.latestRound.appealCost).add(
              toBN(token.latestRequest.latestRound.appealCost)
                .mul(toBN(sharedStakeMultiplier))
                .div(toBN(MULTIPLIER_DIVISOR))
            )
          )
        } else if (ruling === 1) {
          token.latestRequest.latestRound.requiredForSide.push(
            toBN(token.latestRequest.latestRound.appealCost).add(
              toBN(token.latestRequest.latestRound.appealCost)
                .mul(toBN(winnerStakeMultiplier))
                .div(toBN(MULTIPLIER_DIVISOR))
            )
          )
          token.latestRequest.latestRound.requiredForSide.push(
            toBN(token.latestRequest.latestRound.appealCost).add(
              toBN(token.latestRequest.latestRound.appealCost)
                .mul(toBN(loserStakeMultiplier))
                .div(toBN(MULTIPLIER_DIVISOR))
            )
          )
        } else {
          token.latestRequest.latestRound.requiredForSide.push(
            toBN(token.latestRequest.latestRound.appealCost).add(
              toBN(token.latestRequest.latestRound.appealCost)
                .mul(toBN(loserStakeMultiplier))
                .div(toBN(MULTIPLIER_DIVISOR))
            )
          )
          token.latestRequest.latestRound.requiredForSide.push(
            toBN(token.latestRequest.latestRound.appealCost).add(
              toBN(token.latestRequest.latestRound.appealCost)
                .mul(toBN(winnerStakeMultiplier))
                .div(toBN(MULTIPLIER_DIVISOR))
            )
          )
        }

        if (typeof arbitratorView.methods.appealPeriod === 'function')
          token.latestRequest.latestRound.appealPeriod = yield call(
            arbitratorView.methods.appealPeriod(token.latestRequest.disputeID)
              .call
          )
        else
          token.latestRequest.latestRound.appealPeriod = [
            1549163380,
            1643771380
          ]
      }
    }

    token = convertFromString(token)
  } else
    token = {
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
    ...token,
    ID,
    status: Number(token.status),
    clientStatus: contractStatusToClientStatus(
      token.status,
      token.latestRequest.disputed
    )
  }
}

/**
 * Request registration
 * @param {{ type: string, payload: ?object, meta: ?object }} action - The action object.
 * @returns {object} - The `lessdux` collection mod object for updating the list of tokens.
 */
function* requestRegistration({ payload: { token, file, fileData, value } }) {
  const { archon, arbitrableTokenList } = yield call(instantiateEnvObjects)

  const tokenToSubmit = {
    name: token.name,
    ticker: token.ticker,
    address: web3Utils.toChecksumAddress(token.address),
    symbolMultihash: token.symbolMultihash
  }

  if (file && fileData) {
    /* eslint-disable unicorn/number-literal-case */
    const data = yield call(readFile, file.preview)
    const fileMultihash = archon.utils.multihashFile(fileData, 0x1b) // keccak-256
    try {
      const ipfsFileObj = yield call(ipfsPublish, "evidence.json", data)
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

  const { arbitrableTokenList, archon } = yield call(instantiateEnvObjects)

  const tokenToSubmit = {
    name: token.name,
    ticker: token.ticker,
    address: web3Utils.toChecksumAddress(token.address),
    symbolMultihash: token.symbolMultihash
  }

  if (file && fileData) {
    /* eslint-disable unicorn/number-literal-case */
    const data = yield call(readFile, file.preview)
    const fileMultihash = archon.utils.multihashFile(fileData, 0x1b) // keccak-256
    try {
      const ipfsFileObj = yield call(ipfsPublish, "evidence.json", data)
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
