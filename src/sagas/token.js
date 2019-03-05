import { all, call, select, takeLatest } from 'redux-saga/effects'

import readFile from '../utils/read-file'
import { lessduxSaga } from '../utils/saga'
import {
  arbitrableTokenList,
  arbitrableAddressList,
  arbitrator,
  archon,
  ARBITRATOR_ADDRESS,
  web3
} from '../bootstrap/dapp-api'
import {
  contractStatusToClientStatus,
  hasPendingRequest,
  convertFromString
} from '../utils/tcr'
import * as tokenActions from '../actions/token'
import * as walletSelectors from '../reducers/wallet'
import * as arbitrableTokenListSelectors from '../reducers/arbitrable-token-list'
import * as arbitrableAddressListSelectors from '../reducers/arbitrable-address-list'
import * as tcrConstants from '../constants/tcr'
import * as errorConstants from '../constants/error'

import ipfsPublish from './api/ipfs-publish'

const { toBN } = web3.utils
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
  let firstToken = ZERO_ID
  let lastToken = ZERO_ID
  if (totalCount > 0) {
    firstToken = yield call(arbitrableTokenList.methods.tokensList(0).call, {
      from: yield select(walletSelectors.getAccount)
    })
    lastToken = yield call(
      arbitrableTokenList.methods.tokensList(totalCount - 1).call,
      { from: yield select(walletSelectors.getAccount) }
    )
  }

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
    lastPage = '' // No op. There are no further tokens.
  }
  /* eslint-enable */

  // Get current page
  let currentPage = 1
  if (cursor !== firstToken && cursor !== ZERO_ID) {
    const itemsBefore = (yield call(
      arbitrableTokenList.methods.queryTokens(
        cursor === firstToken ? ZERO_ID : cursor,
        100,
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
  const account = yield select(walletSelectors.getAccount)

  // web3js@1.0.0-beta.34 returns null if a string value in the smart contract is "0x".
  if (token.name === null || token['0'] === null) {
    token.name = '0x'
    token['0'] = '0x'
  }

  if (token.ticker === null || token['1'] === null) {
    token.ticker = '0x'
    token['1'] = '0x'
  }

  if (Number(token.numberOfRequests > 0)) {
    token.latestRequest = yield call(
      arbitrableTokenList.methods.getRequestInfo(
        ID,
        Number(token.numberOfRequests) - 1
      ).call
    )

    token.latestRequest.evidenceGroupID = web3.utils
      .toBN(web3.utils.soliditySha3(ID, Number(token.numberOfRequests) - 1))
      .toString()

    // Calculate amount withdrawable
    let i
    token.withdrawable = web3.utils.toBN(0)
    if (token.latestRequest.resolved) i = token.numberOfRequests - 1
    // Start from the last round.
    else if (token.numberOfRequests > 1) i = token.numberOfRequests - 2 // Start from the penultimate round.

    while (i >= 0) {
      const amount = yield call(
        arbitrableTokenList.methods.amountWithdrawable(ID, account, i).call
      )
      token.withdrawable = token.withdrawable.add(web3.utils.toBN(amount))
      i--
    }

    token.latestRequest.latestRound = yield call(
      arbitrableTokenList.methods.getRoundInfo(
        ID,
        Number(token.numberOfRequests) - 1,
        Number(token.latestRequest.numberOfRounds) - 1
      ).call
    )

    token.latestRequest.latestRound.paidFees[1] = toBN(
      token.latestRequest.latestRound.paidFees[1]
    )
    token.latestRequest.latestRound.paidFees[2] = toBN(
      token.latestRequest.latestRound.paidFees[2]
    )

    if (token.latestRequest.disputed) {
      // Fetch dispute data.
      token.latestRequest.dispute = {}
      arbitrator.options.address = token.latestRequest.arbitrator
      token.latestRequest.dispute.status = yield call(
        arbitrator.methods.disputeStatus(token.latestRequest.disputeID).call
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
        token.latestRequest.dispute.ruling = yield call(
          arbitrator.methods.currentRuling(token.latestRequest.disputeID).call
        )
        token.latestRequest.latestRound.appealCost = yield call(
          arbitrator.methods.appealCost(token.latestRequest.disputeID, '0x0')
            .call
        )

        const winnerStakeMultiplier = yield select(
          arbitrableTokenListSelectors.getWinnerStakeMultiplier
        )
        const loserStakeMultiplier = yield select(
          arbitrableTokenListSelectors.getLoserStakeMultiplier
        )
        const sharedStakeMultiplier = yield select(
          arbitrableTokenListSelectors.getSharedStakeMultiplier
        )
        token.latestRequest.latestRound.requiredForSide = [0]

        const ruling = Number(token.latestRequest.dispute.ruling)
        if (ruling === 0) {
          token.latestRequest.latestRound.requiredForSide.push(
            toBN(token.latestRequest.latestRound.appealCost).add(
              toBN(token.latestRequest.latestRound.appealCost).mul(
                toBN(sharedStakeMultiplier)
              )
            )
          )
          token.latestRequest.latestRound.requiredForSide.push(
            toBN(token.latestRequest.latestRound.appealCost).add(
              toBN(token.latestRequest.latestRound.appealCost).mul(
                toBN(sharedStakeMultiplier)
              )
            )
          )
        } else if (ruling === 1) {
          token.latestRequest.latestRound.requiredForSide.push(
            toBN(token.latestRequest.latestRound.appealCost).add(
              toBN(token.latestRequest.latestRound.appealCost).mul(
                toBN(winnerStakeMultiplier)
              )
            )
          )
          token.latestRequest.latestRound.requiredForSide.push(
            toBN(token.latestRequest.latestRound.appealCost).add(
              toBN(token.latestRequest.latestRound.appealCost).mul(
                toBN(loserStakeMultiplier)
              )
            )
          )
        } else {
          token.latestRequest.latestRound.requiredForSide.push(
            toBN(token.latestRequest.latestRound.appealCost).add(
              toBN(token.latestRequest.latestRound.appealCost).mul(
                toBN(loserStakeMultiplier)
              )
            )
          )
          token.latestRequest.latestRound.requiredForSide.push(
            toBN(token.latestRequest.latestRound.appealCost).add(
              toBN(token.latestRequest.latestRound.appealCost).mul(
                toBN(winnerStakeMultiplier)
              )
            )
          )
        }

        if (typeof arbitrator.methods.appealPeriod === 'function')
          token.latestRequest.latestRound.appealPeriod = yield call(
            arbitrator.methods.appealPeriod(token.latestRequest.disputeID).call
          )
        else
          token.latestRequest.latestRound.appealPeriod = [
            1549163380,
            1643771380
          ]
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

      badge.latestRequest.evidenceGroupID = web3.utils
        .toBN(web3.utils.soliditySha3(addr, Number(badge.numberOfRequests) - 1))
        .toString()

      badge.latestRequest.latestRound = yield call(
        arbitrableAddressList.methods.getRoundInfo(
          addr,
          Number(badge.numberOfRequests) - 1,
          Number(badge.latestRequest.numberOfRounds) - 1
        ).call
      )

      badge.latestRequest.latestRound.paidFees[1] = toBN(
        badge.latestRequest.latestRound.paidFees[1]
      )
      badge.latestRequest.latestRound.paidFees[2] = toBN(
        badge.latestRequest.latestRound.paidFees[2]
      )

      if (badge.latestRequest.disputed) {
        // Fetch dispute data.
        arbitrator.options.address = badge.latestRequest.arbitrator
        badge.latestRequest.dispute = {}
        badge.latestRequest.dispute.status = yield call(
          arbitrator.methods.disputeStatus(badge.latestRequest.disputeID).call
        )

        // Fetch appeal disputeID, if there was an appeal.
        if (Number(badge.latestRequest.numberOfRounds) > 2) {
          badge.latestRequest.appealDisputeID = badge.latestRequest.disputeID
          badge.latestRequest.dispute.appealStatus =
            badge.latestRequest.dispute.status
        } else badge.latestRequest.appealDisputeID = 0

        // Fetch appeal period and cost if in appeal period.
        if (
          badge.latestRequest.dispute.status ===
            tcrConstants.DISPUTE_STATUS.Appealable.toString() &&
          !badge.latestRequest.latestRound.appealed
        ) {
          badge.latestRequest.dispute.ruling = yield call(
            arbitrator.methods.currentRuling(badge.latestRequest.disputeID).call
          )
          badge.latestRequest.latestRound.appealCost = yield call(
            arbitrator.methods.appealCost(badge.latestRequest.disputeID, '0x0')
              .call
          )

          const winnerStakeMultiplier = yield select(
            arbitrableAddressListSelectors.getWinnerStakeMultiplier
          )
          const loserStakeMultiplier = yield select(
            arbitrableAddressListSelectors.getLoserStakeMultiplier
          )
          const sharedStakeMultiplier = yield select(
            arbitrableAddressListSelectors.getSharedStakeMultiplier
          )
          badge.latestRequest.latestRound.requiredForSide = [0]

          const ruling = Number(badge.latestRequest.dispute.ruling)
          if (ruling === 0) {
            badge.latestRequest.latestRound.requiredForSide.push(
              toBN(badge.latestRequest.latestRound.appealCost).add(
                toBN(badge.latestRequest.latestRound.appealCost).mul(
                  toBN(sharedStakeMultiplier)
                )
              )
            )
            badge.latestRequest.latestRound.requiredForSide.push(
              toBN(badge.latestRequest.latestRound.appealCost).add(
                toBN(badge.latestRequest.latestRound.appealCost).mul(
                  toBN(sharedStakeMultiplier)
                )
              )
            )
          } else if (ruling === 1) {
            badge.latestRequest.latestRound.requiredForSide.push(
              toBN(badge.latestRequest.latestRound.appealCost).add(
                toBN(badge.latestRequest.latestRound.appealCost).mul(
                  toBN(winnerStakeMultiplier)
                )
              )
            )
            badge.latestRequest.latestRound.requiredForSide.push(
              toBN(badge.latestRequest.latestRound.appealCost).add(
                toBN(badge.latestRequest.latestRound.appealCost).mul(
                  toBN(loserStakeMultiplier)
                )
              )
            )
          } else {
            badge.latestRequest.latestRound.requiredForSide.push(
              toBN(badge.latestRequest.latestRound.appealCost).add(
                toBN(badge.latestRequest.latestRound.appealCost).mul(
                  toBN(loserStakeMultiplier)
                )
              )
            )
            badge.latestRequest.latestRound.requiredForSide.push(
              toBN(badge.latestRequest.latestRound.appealCost).add(
                toBN(badge.latestRequest.latestRound.appealCost).mul(
                  toBN(winnerStakeMultiplier)
                )
              )
            )
          }

          if (typeof arbitrator.methods.appealPeriod === 'function')
            badge.latestRequest.latestRound.appealPeriod = yield call(
              arbitrator.methods.appealPeriod(badge.latestRequest.disputeID)
                .call
            )
          else
            badge.latestRequest.latestRound.appealPeriod = [
              1549163380,
              1643771380
            ]
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
        feeRewards: 0,
        pot: [],
        resolved: false,
        parties: [],
        latestRound: {
          appealed: false,
          paidFees: new Array(3).fill(web3.utils.toBN(0)),
          requiredForSide: new Array(3).fill(web3.utils.toBN(0))
        }
      }

    token.badge = {
      ...badge,
      status: Number(badge.status),
      clientStatus: contractStatusToClientStatus(
        badge.status,
        badge.latestRequest.disputed
      )
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
          paidFees: new Array(3).fill(web3.utils.toBN(0)),
          requiredForSide: new Array(3).fill(web3.utils.toBN(0))
        }
      },
      badge: {
        status: 0,
        numberOfRequests: 0,
        latestRequest: {
          disputed: false,
          disputeID: 0,
          appealDisputeID: 0,
          dispute: null,
          submissionTime: 0,
          feeRewards: 0,
          pot: [],
          resolved: false,
          parties: [],
          latestRound: {
            appealed: false,
            paidFees: new Array(3).fill(web3.utils.toBN(0)),
            requiredForSide: new Array(3).fill(web3.utils.toBN(0))
          }
        }
      },
      numberOfRequests: 0
    }

  if (!token.badge || !token.badge.status)
    token.badge = {
      status: 0,
      latestRequest: { disputed: false }
    }

  arbitrator.options.address = ARBITRATOR_ADDRESS

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
  const tokenToSubmit = {
    name: token.name,
    ticker: token.ticker,
    addr: web3.utils.toChecksumAddress(token.addr),
    symbolMultihash: token.symbolMultihash
  }

  if (file && fileData) {
    /* eslint-disable unicorn/number-literal-case */
    const data = yield call(readFile, file.preview)
    const fileMultihash = archon.utils.multihashFile(fileData, 0x1b) // keccak-256
    try {
      const ipfsFileObj = yield call(ipfsPublish, fileMultihash, data)
      tokenToSubmit.symbolMultihash = `/ipfs/${ipfsFileObj[1].hash}${
        ipfsFileObj[0].path
      }`
    } catch (err) {
      throw new Error('Failed to upload token image', err)
    }
  }

  const { name, ticker, addr, symbolMultihash } = tokenToSubmit

  if (isInvalid(name) || isInvalid(ticker) || isInvalid(symbolMultihash))
    throw new Error('Missing data on token submit', tokenToSubmit)

  const ID = web3.utils.soliditySha3(
    name || '',
    ticker || '',
    addr,
    symbolMultihash
  )
  const recentToken = yield call(fetchToken, { payload: { ID } })

  if (recentToken.status !== tcrConstants.IN_CONTRACT_STATUS_ENUM.Absent)
    throw new Error(errorConstants.TOKEN_IN_WRONG_STATE)

  yield call(
    arbitrableTokenList.methods.requestStatusChange(
      tokenToSubmit.name,
      tokenToSubmit.ticker,
      tokenToSubmit.addr,
      tokenToSubmit.symbolMultihash
    ).send,
    {
      from: yield select(walletSelectors.getAccount),
      value: value.toString()
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
  if (isInvalid(token.ID) && isInvalid(token.addr))
    throw new Error('Missing address on token submit', token)

  const tokenToSubmit = {
    name: token.name,
    ticker: token.ticker,
    addr: web3.utils.toChecksumAddress(token.addr),
    symbolMultihash: token.symbolMultihash
  }

  if (file && fileData) {
    /* eslint-disable unicorn/number-literal-case */
    const data = yield call(readFile, file.preview)
    const fileMultihash = archon.utils.multihashFile(fileData, 0x1b) // keccak-256
    try {
      const ipfsFileObj = yield call(ipfsPublish, fileMultihash, data)
      tokenToSubmit.symbolMultihash = `/ipfs/${ipfsFileObj[1].hash}${
        ipfsFileObj[0].path
      }`
    } catch (err) {
      throw new Error('Failed to upload token image', err)
    }
  }

  const { name, ticker, addr, symbolMultihash } = tokenToSubmit

  if (isInvalid(name) || isInvalid(ticker) || isInvalid(symbolMultihash))
    throw new Error('Missing data on token submit', tokenToSubmit)

  const ID = web3.utils.soliditySha3(
    name || '',
    ticker || '',
    addr,
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
      tokenToSubmit.addr,
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
  let count = 0
  if (!item.latestRequest.resolved) count = item.numberOfRequests - 2

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
