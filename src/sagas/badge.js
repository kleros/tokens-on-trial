import { all, call, select, takeLatest } from 'redux-saga/effects'

import { lessduxSaga } from '../utils/saga'
import {
  arbitrableAddressList,
  arbitrableTokenList,
  arbitrator
} from '../bootstrap/dapp-api'
import { contractStatusToClientStatus, convertFromString } from '../utils/tcr'
import * as badgeActions from '../actions/badge'
import * as walletSelectors from '../reducers/wallet'
import * as tcrConstants from '../constants/tcr'

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
export function* fetchBadge({ payload: { addr } }) {
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
        if (typeof arbitrator.methods.appealPeriod === 'function')
          badge.latestRequest.latestRound.appealPeriod = yield call(
            arbitrator.methods.appealPeriod(badge.latestRequest.disputeID).call
          )
        else
          badge.latestRequest.latestRound.appealPeriod = [
            1549163380,
            1643771380
          ]
      }
    }

    const tokenIDs = (yield call(
      arbitrableTokenList.methods.queryTokens(
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
          call(arbitrableTokenList.methods.getTokenInfo(ID).call)
        )
      )).filter(
        token => Number(token.status) === 1 || Number(token.status) === 3
      )

    if (tokens && tokens.length === 1) badge.token = tokens[0]

    badge = convertFromString(badge)
  } else
    badge = {
      status: 0,
      latestRequest: {
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
    }

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
function* challengeBadgeRequest({ payload: { addr, value } }) {
  yield call(arbitrableAddressList.methods.challengeRequest(addr).send, {
    from: yield select(walletSelectors.getAccount),
    value
  })

  return yield call(fetchBadge, { payload: { addr } })
}

/**
 * Fund a side of a dispute.
 * @param {{ type: string, payload: ?object, meta: ?object }} action - The action object.
 * @returns {object} - The `lessdux` collection mod object for updating the list of badges.
 */
function* fundBadgeDispute({ payload: { addr, side, value } }) {
  yield call(arbitrableAddressList.methods.fundLatestRound(addr, side).send, {
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
  yield call(arbitrableAddressList.methods.fundLatestRound(addr, side).send, {
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
  yield call(arbitrableAddressList.methods.timeout(addr).send, {
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
  yield call(arbitrableAddressList.methods.timeout(badge.addr).send, {
    from: yield select(walletSelectors.getAccount)
  })

  const { addr } = badge
  return yield call(fetchBadge, { payload: { addr } })
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
}
