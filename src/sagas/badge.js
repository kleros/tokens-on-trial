import { call, select, takeLatest } from 'redux-saga/effects'

import { lessduxSaga } from '../utils/saga'
import { arbitrator, arbitrableAddressList } from '../bootstrap/dapp-api'
import { contractStatusToClientStatus, convertFromString } from '../utils/tcr'
import * as badgeActions from '../actions/badge'
import * as walletSelectors from '../reducers/wallet'
import * as tcrConstants from '../constants/tcr'

/**
 * Fetches a token's badge status.
 * @param {{ type: string, payload: ?object, meta: ?object }} action - The action object.
 * @returns {object} - The fetched address.
 */
export function* fetchBadgeStatus({ payload: { token } }) {
  const { addr } = token
  let address = yield call(
    arbitrableAddressList.methods.getAddressInfo(addr).call
  )

  if (Number(address.numberOfRequests > 0)) {
    address.latestRequest = yield call(
      arbitrableAddressList.methods.getRequestInfo(
        addr,
        Number(address.numberOfRequests) - 1
      ).call
    )

    address.latestRequest.latestRound = yield call(
      arbitrableAddressList.methods.getRoundInfo(
        addr,
        Number(address.numberOfRequests) - 1,
        Number(address.latestRequest.numberOfRounds) - 1
      ).call
    )

    if (address.latestRequest.disputed) {
      // Fetch dispute data.
      address.latestRequest.dispute = yield call(
        arbitrator.methods.disputes(address.latestRequest.disputeID).call
      )
      address.latestRequest.dispute.status = yield call(
        arbitrator.methods.disputeStatus(address.latestRequest.disputeID).call
      )

      // Fetch appeal period and cost if in appeal period.
      if (
        address.latestRequest.dispute.status ===
          tcrConstants.DISPUTE_STATUS.Appealable.toString() &&
        !address.latestRequest.latestRound.appealed
      ) {
        address.latestRequest.latestRound.appealCost = yield call(
          arbitrator.methods.appealCost(address.latestRequest.disputeID, '0x0')
            .call
        )

        address.latestRequest.latestRound.appealPeriod = yield call(
          arbitrator.methods.appealPeriod(address.latestRequest.disputeID).call
        )
      }
    }

    address = convertFromString(address)
  } else
    address.latestRequest = {
      disputed: false,
      disputeID: 0,
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

  return {
    ...address,
    status: Number(address.status),
    clientStatus: contractStatusToClientStatus(
      address.status,
      address.latestRequest.disputed,
      address.latestRequest.resolved
    )
  }
}

/**
 * Requests status change.
 * @param {{ type: string, payload: ?object, meta: ?object }} action - The action object.
 * @returns {object} - The `lessdux` collection mod object for updating the list of tokens.
 */
function* requestStatusChange({ payload: { token, value } }) {
  if (isInvalid(token.addr))
    throw new Error('Missing address on token submit', token)

  yield call(
    arbitrableAddressList.methods.requestStatusChange(token.addr).send,
    {
      from: yield select(walletSelectors.getAccount),
      value
    }
  )

  const { addr } = token
  return yield call(fetchBadgeStatus, { payload: { addr } })
}

/**
 * Challenge request.
 * @param {{ type: string, payload: ?object, meta: ?object }} action - The action object.
 * @returns {object} - The `lessdux` collection mod object for updating the list of tokens.
 */
function* challengeRequest({ payload: { addr, value } }) {
  yield call(arbitrableAddressList.methods.challengeRequest(addr).send, {
    from: yield select(walletSelectors.getAccount),
    value
  })

  return yield call(fetchBadgeStatus, { payload: { addr } })
}

/**
 * Fund a side of a dispute.
 * @param {{ type: string, payload: ?object, meta: ?object }} action - The action object.
 * @returns {object} - The `lessdux` collection mod object for updating the list of tokens.
 */
function* fundDispute({ payload: { addr, value, side } }) {
  yield call(arbitrableAddressList.methods.fundLatestRound(addr, side).send, {
    from: yield select(walletSelectors.getAccount),
    value
  })

  return yield call(fetchBadgeStatus, { payload: { addr } })
}

/**
 * Fund a side of a dispute
 * @param {{ type: string, payload: ?object, meta: ?object }} action - The action object.
 * @returns {object} - The `lessdux` collection mod object for updating the list of tokens.
 */
function* fundAppealBadge({ payload: { addr, side, value } }) {
  yield call(arbitrableAddressList.methods.fundLatestRound(addr, side).send, {
    from: yield select(walletSelectors.getAccount),
    value
  })

  return yield call(fetchBadgeStatus, { payload: { addr } })
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

  const { addr } = token
  return yield call(fetchBadgeStatus, { payload: { addr } })
}

/**
 * Timeout challenger.
 * @param {{ type: string, payload: ?object, meta: ?object }} action - The action object.
 * @returns {object} - The `lessdux` collection mod object for updating the list of tokens.
 */
function* feeTimeout({ payload: { token } }) {
  yield call(arbitrableAddressList.methods.timeout(token.addr).send, {
    from: yield select(walletSelectors.getAccount)
  })

  const { addr } = token
  return yield call(fetchBadgeStatus, { payload: { addr } })
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
  collection: badgeActions.badges.self,
  updating: ({ payload: { addr } }) => addr,
  find: ({ payload: { addr } }) => d => d.addr === addr
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
    fetchBadgeStatus
  )
  yield takeLatest(
    badgeActions.badge.CREATE,
    lessduxSaga,
    {
      flow: 'create',
      collection: badgeActions.badges.self
    },
    badgeActions.badge,
    requestStatusChange
  )
  yield takeLatest(
    badgeActions.badge.STATUS_CHANGE,
    lessduxSaga,
    updateTokensCollectionModFlow,
    badgeActions.badge,
    requestStatusChange
  )
  yield takeLatest(
    badgeActions.badge.RESUBMIT,
    lessduxSaga,
    updateTokensCollectionModFlow,
    badgeActions.badge,
    requestStatusChange
  )
  yield takeLatest(
    badgeActions.badge.CLEAR,
    lessduxSaga,
    updateTokensCollectionModFlow,
    badgeActions.badge,
    requestStatusChange
  )
  yield takeLatest(
    badgeActions.badge.EXECUTE,
    lessduxSaga,
    updateTokensCollectionModFlow,
    badgeActions.badge,
    badgeTimeout
  )
  yield takeLatest(
    badgeActions.badge.FUND_DISPUTE,
    lessduxSaga,
    updateTokensCollectionModFlow,
    badgeActions.badge,
    fundDispute
  )
  yield takeLatest(
    badgeActions.badge.FEES_TIMEOUT,
    lessduxSaga,
    updateTokensCollectionModFlow,
    badgeActions.badge,
    feeTimeout
  )
  yield takeLatest(
    badgeActions.badge.FUND_APPEAL,
    lessduxSaga,
    updateTokensCollectionModFlow,
    badgeActions.badge,
    fundAppealBadge
  )
  yield takeLatest(
    badgeActions.badge.CHALLENGE_REQUEST,
    lessduxSaga,
    updateTokensCollectionModFlow,
    badgeActions.badge,
    challengeRequest
  )
}
