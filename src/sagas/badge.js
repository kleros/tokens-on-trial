import { all, call, select, takeLatest } from 'redux-saga/effects'

import { lessduxSaga } from '../utils/saga'
import {
  contractStatusToClientStatus,
  convertFromString,
  instantiateEnvObjects
} from '../utils/tcr'
import * as badgeActions from '../actions/badge'
import * as walletSelectors from '../reducers/wallet'
import * as tcrConstants from '../constants/tcr'
import { web3Utils } from '../bootstrap/dapp-api'

const { toBN } = web3Utils

const ZERO_ID =
  '0x0000000000000000000000000000000000000000000000000000000000000000'
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
 * Fetches a badge from the list.
 * @param {{ type: string, payload: ?object, meta: ?object }} action - The action object.
 * @returns {object} - The fetched badge.
 */
export function* fetchBadge({ payload: { tokenAddress, badgeContractAddr } }) {
  const account = yield select(walletSelectors.getAccount)
  const {
    badgeViewContracts,
    arbitrableTokenListView,
    arbitratorView
  } = yield call(instantiateEnvObjects)

  try {
    badgeContractAddr = web3Utils.toChecksumAddress(badgeContractAddr)
    const arbitrableAddressListView = badgeViewContracts[badgeContractAddr]

    let badge = yield call(
      arbitrableAddressListView.methods.getAddressInfo(tokenAddress).call
    )
    badge.requests = []

    if (Number(badge.numberOfRequests > 0)) {
      for (let i = 0; i < badge.numberOfRequests; i++) {
        const request = yield call(
          arbitrableAddressListView.methods.getRequestInfo(tokenAddress, i).call
        )
        if (request.arbitratorExtraData === null)
          request.arbitratorExtraData = '0x' // Workaround web3js bug. Web3js returns null if extra data is '0x'

        request.evidenceGroupID = web3Utils
          .toBN(web3Utils.soliditySha3(tokenAddress, i))
          .toString()

        badge.requests.push(request)
      }

      badge.latestRequest = badge.requests[badge.requests.length - 1]

      // Calculate amount withdrawable
      let i
      badge.withdrawable = web3Utils.toBN(0)
      if (badge.latestRequest.resolved) i = badge.numberOfRequests - 1
      // Start from the last round.
      else if (badge.numberOfRequests > 1) i = badge.numberOfRequests - 2 // Start from the penultimate round.

      while (i >= 0) {
        const amount = yield call(
          arbitrableAddressListView.methods.amountWithdrawable(
            tokenAddress,
            account,
            i
          ).call
        )
        badge.withdrawable = badge.withdrawable.add(web3Utils.toBN(amount))
        i--
      }

      badge.latestRequest.latestRound = yield call(
        arbitrableAddressListView.methods.getRoundInfo(
          tokenAddress,
          Number(badge.numberOfRequests) - 1,
          Number(badge.latestRequest.numberOfRounds) - 1
        ).call
      )
      badge.latestRequest.latestRound.paidFees[0] = toBN(
        badge.latestRequest.latestRound.paidFees[0]
      )
      badge.latestRequest.latestRound.paidFees[1] = toBN(
        badge.latestRequest.latestRound.paidFees[1]
      )
      badge.latestRequest.latestRound.paidFees[2] = toBN(
        badge.latestRequest.latestRound.paidFees[2]
      )

      if (badge.latestRequest.disputed) {
        // Fetch dispute data.
        arbitratorView.options.tokenAddress = badge.latestRequest.arbitrator
        badge.latestRequest.dispute = yield call(
          arbitratorView.methods.disputes(badge.latestRequest.disputeID).call
        )
        badge.latestRequest.dispute.court = yield call(
          arbitratorView.methods.getSubcourt(
            badge.latestRequest.dispute.subcourtID
          ).call
        )
        badge.latestRequest.dispute.status = yield call(
          arbitratorView.methods.disputeStatus(badge.latestRequest.disputeID)
            .call
        )
        badge.latestRequest.dispute.ruling = yield call(
          arbitratorView.methods.currentRuling(badge.latestRequest.disputeID)
            .call
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
          badge.latestRequest.latestRound.appealCost = yield call(
            arbitratorView.methods.appealCost(
              badge.latestRequest.disputeID,
              badge.latestRequest.arbitratorExtraData
            ).call
          )
          const MULTIPLIER_DIVISOR = yield call(
            arbitrableAddressListView.methods.MULTIPLIER_DIVISOR().call
          )
          const winnerStakeMultiplier = yield call(
            arbitrableAddressListView.methods.winnerStakeMultiplier().call
          )
          const loserStakeMultiplier = yield call(
            arbitrableAddressListView.methods.loserStakeMultiplier().call
          )
          const sharedStakeMultiplier = yield call(
            arbitrableAddressListView.methods.sharedStakeMultiplier().call
          )
          badge.latestRequest.latestRound.requiredForSide = [toBN(0)]

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
          tokenAddress // The token address for which to return the submissions.
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
            paidFees: new Array(3).fill(web3Utils.toBN(0)),
            requiredForSide: new Array(3).fill(web3Utils.toBN(0))
          }
        }
      }

    return {
      ...badge,
      tokenAddress,
      badgeContractAddr,
      status: Number(badge.status),
      clientStatus: contractStatusToClientStatus(
        badge.status,
        badge.latestRequest.disputed,
        badge.latestRequest.resolved
      )
    }
  } catch (err) {
    console.info('Error fetching badge', err)
  }
}

/* Badge function generators */

/**
 * Requests status change.
 * @param {{ type: string, payload: ?object, meta: ?object }} action - The action object.
 * @returns {object} - The `lessdux` collection mod object for updating the list of badges.
 */
function* requestStatusChangeBadge({
  payload: { badgeContractAddr, tokenAddr, value }
}) {
  if (isInvalid(tokenAddr))
    throw new Error('Missing address on badge submit', tokenAddr)

  const { badgeContracts } = yield call(instantiateEnvObjects)
  const arbitrableAddressList = badgeContracts[badgeContractAddr]

  yield call(
    arbitrableAddressList.methods.requestStatusChange(tokenAddr).send,
    {
      from: yield select(walletSelectors.getAccount),
      value
    }
  )

  return yield call(fetchBadge, { payload: { tokenAddr, badgeContractAddr } })
}

/**
 * Challenge request.
 * @param {{ type: string, payload: ?object, meta: ?object }} action - The action object.
 * @returns {object} - The `lessdux` collection mod object for updating the list of badges.
 */
function* challengeBadgeRequest({
  payload: { tokenAddr, badgeContractAddr, value, evidence }
}) {
  const { badgeContracts } = yield call(instantiateEnvObjects)
  const arbitrableAddressList = badgeContracts[badgeContractAddr]

  yield call(
    arbitrableAddressList.methods.challengeRequest(tokenAddr, evidence).send,
    {
      from: yield select(walletSelectors.getAccount),
      value
    }
  )
  return yield call(fetchBadge, { payload: { tokenAddr, badgeContractAddr } })
}

/**
 * Fund a side of a dispute.
 * @param {{ type: string, payload: ?object, meta: ?object }} action - The action object.
 * @returns {object} - The `lessdux` collection mod object for updating the list of badges.
 */
function* fundBadgeDispute({
  payload: { tokenAddr, badgeContractAddr, side, value }
}) {
  const { badgeContracts } = yield call(instantiateEnvObjects)
  const arbitrableAddressList = badgeContracts[badgeContractAddr]

  yield call(arbitrableAddressList.methods.fundAppeal(tokenAddr, side).send, {
    from: yield select(walletSelectors.getAccount),
    value
  })
  return yield call(fetchBadge, { payload: { tokenAddr, badgeContractAddr } })
}

/**
 * Fund a side of a dispute
 * @param {{ type: string, payload: ?object, meta: ?object }} action - The action object.
 * @returns {object} - The `lessdux` collection mod object for updating the list of badges.
 */
function* fundBadgeAppeal({
  payload: { tokenAddr, badgeContractAddr, side, value }
}) {
  const { badgeContracts } = yield call(instantiateEnvObjects)
  const arbitrableAddressList = badgeContracts[badgeContractAddr]

  yield call(arbitrableAddressList.methods.fundAppeal(tokenAddr, side).send, {
    from: yield select(walletSelectors.getAccount),
    value
  })
  return yield call(fetchBadge, { payload: { tokenAddr, badgeContractAddr } })
}

/**
 * Execute a request for a badge.
 * @param {{ type: string, payload: ?object, meta: ?object }} action - The action object.
 * @returns {object} - The `lessdux` collection mod object for updating the list of badges.
 */
function* badgeTimeout({ payload: { badgeContractAddr, tokenAddr } }) {
  const { badgeContracts } = yield call(instantiateEnvObjects)
  const arbitrableAddressList = badgeContracts[badgeContractAddr]

  yield call(arbitrableAddressList.methods.executeRequest(tokenAddr).send, {
    from: yield select(walletSelectors.getAccount)
  })
  return yield call(fetchBadge, { payload: { badgeContractAddr, tokenAddr } })
}

/**
 * Timeout challenger.
 * @param {{ type: string, payload: ?object, meta: ?object }} action - The action object.
 * @returns {object} - The `lessdux` collection mod object for updating the list of badges.
 */
function* feeTimeoutBadge({ payload: { tokenAddr, badgeContractAddr } }) {
  const { badgeContracts } = yield call(instantiateEnvObjects)
  const arbitrableAddressList = badgeContracts[badgeContractAddr]

  yield call(arbitrableAddressList.methods.executeRequest(tokenAddr).send, {
    from: yield select(walletSelectors.getAccount)
  })

  return yield call(fetchBadge, { payload: { tokenAddr, badgeContractAddr } })
}

/**
 * Withdraw funds from badge's latest request.
 * @param {{ type: string, payload: ?object, meta: ?object }} action - The action object.
 * @returns {object} - The `lessdux` collection mod object for updating the badge object.
 */
function* withdrawBadgeFunds({
  payload: { tokenAddr, badgeContractAddr, item }
}) {
  let count = 5
  if (!item.latestRequest.resolved) count = item.numberOfRequests - 2
  const { badgeContracts } = yield call(instantiateEnvObjects)
  const arbitrableAddressList = badgeContracts[badgeContractAddr]

  yield call(
    arbitrableAddressList.methods.batchRequestWithdraw(
      yield select(walletSelectors.getAccount),
      tokenAddr,
      0,
      count,
      0,
      0
    ).send,
    { from: yield select(walletSelectors.getAccount) }
  )
  return yield call(fetchBadge, { payload: { tokenAddr, badgeContractAddr } })
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
  updating: ({ payload: { address } }) => address,
  find: ({ payload: { address } }) => d => d.address === address
}

/**
 * The root of the badge saga.
 */
export default function* badgeSaga() {
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
