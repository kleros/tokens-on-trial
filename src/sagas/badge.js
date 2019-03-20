import { all, call, select, takeLatest } from 'redux-saga/effects'

import { lessduxSaga } from '../utils/saga'
import {
  arbitrableAddressList,
  arbitrableAddressListView,
  arbitrableTokenListView,
  arbitratorView,
  ARBITRATOR_ADDRESS,
  viewWeb3
} from '../bootstrap/dapp-api'
import { contractStatusToClientStatus, convertFromString } from '../utils/tcr'
import * as badgeActions from '../actions/badge'
import * as walletSelectors from '../reducers/wallet'
import * as tcrConstants from '../constants/tcr'
import * as arbitrableAddressListSelectors from '../reducers/arbitrable-address-list'

const { toBN } = viewWeb3.utils

const ZERO_ID =
  '0x0000000000000000000000000000000000000000000000000000000000000000'
const ZERO_ADDR = '0x0000000000000000000000000000000000000000'
const filter = [
  false, // Do not include tokens which are not on the TCR.
  true, // Include registered tokens.
  false, // Do not include tokens with pending registration requests.
  true, // Include tokens with pending clearing requests.
  false, // Do not include tokens with challenged registration requests.
  true, // Include tokens with challenged clearing requests.
  false, // Include token if caller is the author of a pending request.
  false // Include token if caller is the challenger of a pending request.
]

/**
 * Fetches a paginatable list of tokens with badges.
 * @param {{ type: string, payload: ?object, meta: ?object }} action - The action object.
 * @returns {object[]} - The fetched tokens with badges.
 */
function* fetchBadges({ payload: { cursor, count, filterValue, sortValue } }) {
  // Token count and stats
  if (cursor === '') cursor = ZERO_ADDR

  const totalCount = Number(
    yield call(arbitrableAddressListView.methods.addressCount().call, {
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
    arbitrableAddressListView.methods.countByStatus().call,
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

  // Fetch first and last addresses
  let firstToken = ZERO_ADDR
  let lastToken = ZERO_ADDR
  if (totalCount > 0) {
    firstToken = yield call(
      arbitrableAddressListView.methods.addressList(0).call,
      {
        from: yield select(walletSelectors.getAccount)
      }
    )
    lastToken = yield call(
      arbitrableAddressListView.methods.addressList(totalCount - 1).call,
      { from: yield select(walletSelectors.getAccount) }
    )
  }

  // Get last page
  let lastPage
  /* eslint-disable no-unused-vars */
  try {
    const lastTokens = yield call(
      arbitrableAddressListView.methods.queryAddresses(
        lastToken,
        count,
        filterValue,
        false
      ).call,
      { from: yield select(walletSelectors.getAccount) }
    )
    lastPage = lastTokens.values.filter(addr => addr !== ZERO_ADDR)[
      lastTokens.values.length - 1
    ]
  } catch (err) {
    lastPage = '' // No op. There are no further tokens.
  }
  /* eslint-enable */

  // Get current page
  let currentPage = 1
  if (cursor !== firstToken && cursor !== ZERO_ADDR) {
    const itemsBefore = (yield call(
      arbitrableAddressListView.methods.queryAddresses(
        cursor === firstToken ? ZERO_ADDR : cursor,
        100,
        filterValue,
        false
      ).call,
      { from: yield select(walletSelectors.getAccount) }
    )).values.filter(ID => ID !== ZERO_ADDR).length

    currentPage =
      itemsBefore <= count
        ? 2
        : itemsBefore % count === 0
        ? itemsBefore / count + 1
        : Math.floor(itemsBefore / count) + 2
  }

  // Fetch tokens
  const data = yield call(
    arbitrableAddressListView.methods.queryAddresses(
      cursor === firstToken ? ZERO_ADDR : cursor,
      count,
      filterValue,
      sortValue
    ).call,
    { from: yield select(walletSelectors.getAccount) }
  )

  const tokenAddresses = data.values.filter(addr => addr !== ZERO_ADDR)
  const tokens = []
  for (const addr of tokenAddresses) {
    const submissionIDs = (yield call(
      arbitrableTokenListView.methods.queryTokens(
        ZERO_ID,
        count,
        [true, true, true, true, true, true, true, true],
        true,
        addr
      ).call,
      { from: yield select(walletSelectors.getAccount) }
    )).values.filter(ID => ID !== ZERO_ID)

    let submissions = []
    for (const submissionID of submissionIDs)
      submissions.push({
        ...(yield call(
          arbitrableTokenListView.methods.getTokenInfo(submissionID).call
        )),
        ID: submissionID
      })

    submissions = submissions.filter(
      submission => Number(submission.status) !== 0
    )
    submissions = submissions.sort((a, b) => {
      a.status = Number(a.status)
      b.status = Number(b.status)
      if (a.status === 1 && b.status !== 1) return -1
      if (a.status !== 1 && b.status === 1) return 1
      if (a.status === 3 && b.status === 2) return -1
      if (a.status === 2 && b.status === 3) return 1
      return 0
    })

    let submission
    if (submissions.length > 0) {
      submission = {
        ...submissions[0],
        status: Number(submissions[0].status)
      }
      submission.latestRequest = yield call(
        arbitrableTokenListView.methods.getRequestInfo(
          submission.ID,
          Number(submission.numberOfRequests) - 1
        ).call
      )
      if (submission.latestRequest.arbitratorExtraData === null)
        submission.latestRequest.arbitratorExtraData = '0x' // Workaround web3js bug. Web3js returns null if extra data is '0x'

      submission.clientStatus = contractStatusToClientStatus(
        submission.status,
        submission.latestRequest.disputed
      )
    }

    const badge = {
      ...(yield call(
        arbitrableAddressListView.methods.getAddressInfo(addr).call
      )),
      addr
    }

    badge.status = Number(badge.status)

    badge.latestRequest = yield call(
      arbitrableAddressListView.methods.getRequestInfo(
        addr,
        Number(badge.numberOfRequests) - 1
      ).call
    )
    if (badge.latestRequest.arbitratorExtraData === null)
      badge.latestRequest.arbitratorExtraData = '0x' // Workaround web3js bug. Web3js returns null if extra data is '0x'

    tokens.push({
      ...submission,
      badge,
      addr
    })
  }

  // Fetch previous page token ID
  /* eslint-disable no-unused-vars */
  let previousPage
  try {
    const previousTokens = yield call(
      arbitrableAddressListView.methods.queryAddresses(
        tokenAddresses[0],
        count + 1,
        filterValue,
        !sortValue
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
 * Fetches a badge from the list.
 * @param {{ type: string, payload: ?object, meta: ?object }} action - The action object.
 * @returns {object} - The fetched badge.
 */
export function* fetchBadge({ payload: { addr } }) {
  const account = yield select(walletSelectors.getAccount)
  let badge = yield call(
    arbitrableAddressListView.methods.getAddressInfo(addr).call
  )

  if (Number(badge.numberOfRequests > 0)) {
    badge.latestRequest = yield call(
      arbitrableAddressListView.methods.getRequestInfo(
        addr,
        Number(badge.numberOfRequests) - 1
      ).call
    )
    if (badge.latestRequest.arbitratorExtraData === null)
      badge.latestRequest.arbitratorExtraData = '0x' // Workaround web3js bug. Web3js returns null if extra data is '0x'

    badge.latestRequest.evidenceGroupID = viewWeb3.utils
      .toBN(
        viewWeb3.utils.soliditySha3(addr, Number(badge.numberOfRequests) - 1)
      )
      .toString()

    // Calculate amount withdrawable
    let i
    badge.withdrawable = viewWeb3.utils.toBN(0)
    if (badge.latestRequest.resolved) i = badge.numberOfRequests - 1
    // Start from the last round.
    else if (badge.numberOfRequests > 1) i = badge.numberOfRequests - 2 // Start from the penultimate round.

    while (i >= 0) {
      const amount = yield call(
        arbitrableAddressListView.methods.amountWithdrawable(addr, account, i)
          .call
      )
      badge.withdrawable = badge.withdrawable.add(viewWeb3.utils.toBN(amount))
      i--
    }

    badge.latestRequest.latestRound = yield call(
      arbitrableAddressListView.methods.getRoundInfo(
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
      arbitratorView.options.address = badge.latestRequest.arbitrator
      badge.latestRequest.dispute = yield call(
        arbitratorView.methods.disputes(badge.latestRequest.disputeID).call
      )
      badge.latestRequest.dispute.court = yield call(
        arbitratorView.methods.getSubcourt(
          badge.latestRequest.dispute.subcourtID
        ).call
      )
      badge.latestRequest.dispute.status = yield call(
        arbitratorView.methods.disputeStatus(badge.latestRequest.disputeID).call
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
          arbitratorView.methods.currentRuling(badge.latestRequest.disputeID)
            .call
        )
        badge.latestRequest.latestRound.appealCost = yield call(
          arbitratorView.methods.appealCost(
            badge.latestRequest.disputeID,
            badge.latestRequest.arbitratorExtraData
          ).call
        )
        const MULTIPLIER_DIVISOR = yield call(
          arbitrableAddressListView.methods.MULTIPLIER_DIVISOR().call
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
              toBN(badge.latestRequest.latestRound.appealCost)
                .mul(toBN(sharedStakeMultiplier))
                .div(toBN(MULTIPLIER_DIVISOR))
            )
          )
          badge.latestRequest.latestRound.requiredForSide.push(
            toBN(badge.latestRequest.latestRound.appealCost).add(
              toBN(badge.latestRequest.latestRound.appealCost)
                .mul(toBN(sharedStakeMultiplier))
                .div(toBN(MULTIPLIER_DIVISOR))
            )
          )
        } else if (ruling === 1) {
          badge.latestRequest.latestRound.requiredForSide.push(
            toBN(badge.latestRequest.latestRound.appealCost).add(
              toBN(badge.latestRequest.latestRound.appealCost)
                .mul(toBN(winnerStakeMultiplier))
                .div(toBN(MULTIPLIER_DIVISOR))
            )
          )
          badge.latestRequest.latestRound.requiredForSide.push(
            toBN(badge.latestRequest.latestRound.appealCost).add(
              toBN(badge.latestRequest.latestRound.appealCost)
                .mul(toBN(loserStakeMultiplier))
                .div(toBN(MULTIPLIER_DIVISOR))
            )
          )
        } else {
          badge.latestRequest.latestRound.requiredForSide.push(
            toBN(badge.latestRequest.latestRound.appealCost).add(
              toBN(badge.latestRequest.latestRound.appealCost)
                .mul(toBN(loserStakeMultiplier))
                .div(toBN(MULTIPLIER_DIVISOR))
            )
          )
          badge.latestRequest.latestRound.requiredForSide.push(
            toBN(badge.latestRequest.latestRound.appealCost).add(
              toBN(badge.latestRequest.latestRound.appealCost)
                .mul(toBN(winnerStakeMultiplier))
                .div(toBN(MULTIPLIER_DIVISOR))
            )
          )
        }

        if (typeof arbitratorView.methods.appealPeriod === 'function')
          badge.latestRequest.latestRound.appealPeriod = yield call(
            arbitratorView.methods.appealPeriod(badge.latestRequest.disputeID)
              .call
          )
        else
          badge.latestRequest.latestRound.appealPeriod = [
            1549163380,
            1643771380
          ]
      }
    }

    const tokenIDs = (yield call(
      arbitrableTokenListView.methods.queryTokens(
        ZERO_ID, // A token ID from which to start/end the query from. Set to zero means unused.
        100, // Number of items to return at once.
        filter,
        true, // Return oldest first.
        addr // The token address for which to return the submissions.
      ).call
    )).values.filter(ID => ID !== ZERO_ID)

    let tokens
    if (tokenIDs && tokenIDs.length > 0)
      tokens = (yield all(
        tokenIDs.map(ID =>
          call(arbitrableTokenListView.methods.getTokenInfo(ID).call)
        )
      )).filter(
        token => Number(token.status) === 1 || Number(token.status) === 3
      )

    if (tokens && tokens.length >= 1) {
      badge.token = tokens[0]
      badge.token.ID = tokenIDs[0]
      // web3js@1.0.0-beta.34 returns null if a string value in the smart contract is "0x".
      if (badge.token.name === null || badge.token['0'] === null) {
        badge.token.name = '0x'
        badge.token['0'] = '0x'
      }

      if (badge.token.ticker === null || badge.token['1'] === null) {
        badge.token.ticker = '0x'
        badge.token['1'] = '0x'
      }
    }

    badge = convertFromString(badge)
  } else
    badge = {
      status: 0,
      numberOfRequests: 0,
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
          paidFees: new Array(3).fill(viewWeb3.utils.toBN(0)),
          requiredForSide: new Array(3).fill(viewWeb3.utils.toBN(0))
        }
      }
    }

  arbitratorView.options.address = ARBITRATOR_ADDRESS

  return {
    ...badge,
    addr,
    status: Number(badge.status),
    clientStatus: contractStatusToClientStatus(
      badge.status,
      badge.latestRequest.disputed,
      badge.latestRequest.resolved
    )
  }
}

/* Badge function generators */

/**
 * Requests status change.
 * @param {{ type: string, payload: ?object, meta: ?object }} action - The action object.
 * @returns {object} - The `lessdux` collection mod object for updating the list of badges.
 */
function* requestStatusChangeBadge({ payload: { badge, value } }) {
  if (isInvalid(badge.addr))
    throw new Error('Missing address on badge submit', badge)

  yield call(
    arbitrableAddressList.methods.requestStatusChange(badge.addr).send,
    {
      from: yield select(walletSelectors.getAccount),
      value
    }
  )

  const { addr } = badge
  return yield call(fetchBadge, { payload: { addr } })
}

/**
 * Challenge request.
 * @param {{ type: string, payload: ?object, meta: ?object }} action - The action object.
 * @returns {object} - The `lessdux` collection mod object for updating the list of badges.
 */
function* challengeBadgeRequest({ payload: { addr, value, evidence } }) {
  yield call(
    arbitrableAddressList.methods.challengeRequest(addr, evidence).send,
    {
      from: yield select(walletSelectors.getAccount),
      value
    }
  )

  return yield call(fetchBadge, { payload: { addr } })
}

/**
 * Fund a side of a dispute.
 * @param {{ type: string, payload: ?object, meta: ?object }} action - The action object.
 * @returns {object} - The `lessdux` collection mod object for updating the list of badges.
 */
function* fundBadgeDispute({ payload: { addr, side, value } }) {
  yield call(arbitrableAddressList.methods.fundAppeal(addr, side).send, {
    from: yield select(walletSelectors.getAccount),
    value
  })

  return yield call(fetchBadge, { payload: { addr } })
}

/**
 * Fund a side of a dispute
 * @param {{ type: string, payload: ?object, meta: ?object }} action - The action object.
 * @returns {object} - The `lessdux` collection mod object for updating the list of badges.
 */
function* fundBadgeAppeal({ payload: { addr, side, value } }) {
  yield call(arbitrableAddressList.methods.fundAppeal(addr, side).send, {
    from: yield select(walletSelectors.getAccount),
    value
  })

  return yield call(fetchBadge, { payload: { addr } })
}

/**
 * Execute a request for a badge.
 * @param {{ type: string, payload: ?object, meta: ?object }} action - The action object.
 * @returns {object} - The `lessdux` collection mod object for updating the list of badges.
 */
function* badgeTimeout({ payload: { addr } }) {
  yield call(arbitrableAddressList.methods.executeRequest(addr).send, {
    from: yield select(walletSelectors.getAccount)
  })

  return yield call(fetchBadge, { payload: { addr } })
}

/**
 * Timeout challenger.
 * @param {{ type: string, payload: ?object, meta: ?object }} action - The action object.
 * @returns {object} - The `lessdux` collection mod object for updating the list of badges.
 */
function* feeTimeoutBadge({ payload: { badge } }) {
  yield call(arbitrableAddressList.methods.executeRequest(badge.addr).send, {
    from: yield select(walletSelectors.getAccount)
  })

  const { addr } = badge
  return yield call(fetchBadge, { payload: { addr } })
}

/**
 * Withdraw funds from badge's latest request.
 * @param {{ type: string, payload: ?object, meta: ?object }} action - The action object.
 * @returns {object} - The `lessdux` collection mod object for updating the badge object.
 */
function* withdrawBadgeFunds({ payload: { address, item } }) {
  let count = 0
  if (!item.latestRequest.resolved) count = item.numberOfRequests - 2

  yield call(
    arbitrableAddressList.methods.batchRequestWithdraw(
      yield select(walletSelectors.getAccount),
      address,
      0,
      count,
      0,
      0
    ).send,
    { from: yield select(walletSelectors.getAccount) }
  )

  return yield call(fetchBadge, { payload: { address } })
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
const updateBadgesCollectionModFlow = {
  flow: 'update',
  collection: badgeActions.badges.self,
  updating: ({ payload: { addr } }) => addr,
  find: ({ payload: { addr } }) => d => d.addr === addr
}

/**
 * The root of the badge saga.
 */
export default function* badgeSaga() {
  // Tokens
  yield takeLatest(
    badgeActions.badges.FETCH,
    lessduxSaga,
    'fetch',
    badgeActions.badges,
    fetchBadges
  )

  // Badge
  yield takeLatest(
    badgeActions.badge.FETCH,
    lessduxSaga,
    'fetch',
    badgeActions.badge,
    fetchBadge
  )
  yield takeLatest(
    badgeActions.badge.CREATE,
    lessduxSaga,
    {
      flow: 'create',
      collection: badgeActions.badges.self
    },
    badgeActions.badge,
    requestStatusChangeBadge
  )
  yield takeLatest(
    badgeActions.badge.STATUS_CHANGE,
    lessduxSaga,
    updateBadgesCollectionModFlow,
    badgeActions.badge,
    requestStatusChangeBadge
  )
  yield takeLatest(
    badgeActions.badge.RESUBMIT,
    lessduxSaga,
    updateBadgesCollectionModFlow,
    badgeActions.badge,
    requestStatusChangeBadge
  )
  yield takeLatest(
    badgeActions.badge.CLEAR,
    lessduxSaga,
    updateBadgesCollectionModFlow,
    badgeActions.badge,
    requestStatusChangeBadge
  )
  yield takeLatest(
    badgeActions.badge.EXECUTE,
    lessduxSaga,
    updateBadgesCollectionModFlow,
    badgeActions.badge,
    badgeTimeout
  )
  yield takeLatest(
    badgeActions.badge.FUND_DISPUTE,
    lessduxSaga,
    updateBadgesCollectionModFlow,
    badgeActions.badge,
    fundBadgeDispute
  )
  yield takeLatest(
    badgeActions.badge.FEES_TIMEOUT,
    lessduxSaga,
    updateBadgesCollectionModFlow,
    badgeActions.badge,
    feeTimeoutBadge
  )
  yield takeLatest(
    badgeActions.badge.FUND_APPEAL,
    lessduxSaga,
    updateBadgesCollectionModFlow,
    badgeActions.badge,
    fundBadgeAppeal
  )
  yield takeLatest(
    badgeActions.badge.CHALLENGE_REQUEST,
    lessduxSaga,
    updateBadgesCollectionModFlow,
    badgeActions.badge,
    challengeBadgeRequest
  )
  yield takeLatest(
    badgeActions.badge.WITHDRAW_FUNDS,
    lessduxSaga,
    updateBadgesCollectionModFlow,
    badgeActions.badge,
    withdrawBadgeFunds
  )
}
