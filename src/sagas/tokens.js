import { put, takeLatest, call } from 'redux-saga/effects'

import {
  FETCH_TOKENS_CACHE,
  cacheTokens,
  fetchTokensFailed
} from '../actions/tokens'
import { web3Utils, APP_VERSION } from '../bootstrap/dapp-api'
import {
  contractStatusToClientStatus,
  instantiateEnvObjects
} from '../utils/tcr'
import * as tcrConstants from '../constants/tcr'

import { fetchAppealable, fetchEvents } from './utils'

/**
 * Fetches token and status information by events.
 * @param {{ type: string, payload: ?object, meta: ?object }} action - The action object.
 */
function* fetchTokens() {
  const {
    arbitrableTokenListView,
    arbitratorView,
    T2CR_BLOCK,
    ARBITRATOR_BLOCK
  } = yield call(instantiateEnvObjects)

  try {
    let tokens = localStorage.getItem(
      `${arbitrableTokenListView.options.address}tokens@${APP_VERSION}`
    )
    if (!tokens)
      tokens = {
        blockNumber: T2CR_BLOCK,
        statusBlockNumber: T2CR_BLOCK,
        items: {},
        addressToIDs: {}
      }
    else {
      tokens = JSON.parse(tokens)
      yield put(cacheTokens(tokens))
      tokens = JSON.parse(JSON.stringify(tokens)) // Get a deep copy.
    }

    const submissionEvents = yield call(
      fetchEvents,
      'TokenSubmitted',
      tokens.blockNumber === T2CR_BLOCK ? T2CR_BLOCK : tokens.blockNumber + 1,
      arbitrableTokenListView
    )

    // Find the block number of the lastest token submission event.
    const blockNumber = submissionEvents.reduce((acc, event) => {
      const { blockNumber } = event
      return blockNumber > acc ? blockNumber : acc
    }, tokens.blockNumber)

    // Web3js does not handle the string "0x" well and returns null
    // or an empty string (depending on the web3 js version). This can
    // be a problem for the case of the ZRX token (previously, 0x), where a
    // party may submit it as either the name or the ticker.
    //
    // Additionaly, there is another bug with the web3.utils.soliditySha3 which
    // also does not parse string "0x" correctly as a parameter and such cannot be
    // used to calculate the token ID (which is the sha3 of it's data).
    //
    // We handle these cases by adding such submissions to the missingTokens array
    // and then manually by merging results from TokenSubmission
    // and TokenStatusChange events.
    const missingTokens = []

    // Build an object with the token submission events
    const receivedTokens = submissionEvents.reduce(
      (acc, event) => {
        const { returnValues } = event
        const { _name, _ticker, _symbolMultihash, _address } = returnValues

        if (!_name || !_ticker) {
          missingTokens.push({
            name: _name,
            ticker: _ticker,
            address: _address,
            symbolMultihash: _symbolMultihash,
            blockNumber: event.blockNumber
          })
          return acc
        }

        const tokenID = web3Utils.soliditySha3(
          _name,
          _ticker,
          _address,
          _symbolMultihash
        )

        acc[tokenID] = {
          name: _name,
          ticker: _ticker,
          address: _address,
          symbolMultihash: _symbolMultihash,
          ID: tokenID,
          status: {
            blockNumber: event.blockNumber,
            statusBlockNumber: event.blockNumber
          }
        }
        return acc
      },
      { ...tokens.items }
    )

    // Save the last token status change.
    let statusBlockNumber = T2CR_BLOCK

    // Get the lastest status change for every token.
    const latestStatusChanges = {}
    const statusChanges = yield call(
      fetchEvents,
      'TokenStatusChange',
      tokens.statusBlockNumber < blockNumber
        ? tokens.statusBlockNumber
        : blockNumber,
      arbitrableTokenListView
    )

    statusChanges.forEach(event => {
      const { returnValues } = event
      const { _tokenID } = returnValues
      if (event.blockNumber > statusBlockNumber)
        statusBlockNumber = event.blockNumber

      if (!latestStatusChanges[_tokenID]) {
        latestStatusChanges[_tokenID] = event
        return
      }
      if (event.blockNumber > latestStatusChanges[_tokenID].blockNumber)
        latestStatusChanges[_tokenID] = event
    })

    const cachedTokens = {
      items: receivedTokens,
      addressToIDs: {},
      blockNumber,
      statusBlockNumber
    }

    const statusEvents = Object.keys(latestStatusChanges).map(
      tokenID => latestStatusChanges[tokenID]
    )

    for (const event of statusEvents) {
      const { returnValues, blockNumber: statusBlockNumber } = event
      const {
        _tokenID,
        _status,
        _disputed,
        _requester,
        _challenger
      } = returnValues

      if (!cachedTokens.items[_tokenID]) {
        // This is a missing token due to the web3js bug described above.
        for (const missingToken of missingTokens) {
          const tokenInfo = yield call(
            arbitrableTokenListView.methods.getTokenInfo(_tokenID).call
          )
          tokenInfo.address = tokenInfo.addr
          if (
            (tokenInfo.name === null || tokenInfo.ticker === null) &&
            tokenInfo.address === missingToken.address &&
            tokenInfo.symbolMultihash === missingToken.symbolMultihash
          )
            cachedTokens.items[_tokenID] = {
              ...missingToken,
              ID: _tokenID,
              status: {
                blockNumber,
                status: Number(_status),
                disputed: Boolean(Number(_disputed)),
                requester: _requester,
                challenger: _challenger
              }
            }
        }
        continue
      }

      if (
        statusBlockNumber >=
        cachedTokens.items[_tokenID].status.statusBlockNumber
      )
        cachedTokens.items[_tokenID].status = {
          ...cachedTokens.items[_tokenID].status,
          statusBlockNumber,
          status: Number(_status),
          disputed: Boolean(Number(_disputed)),
          requester: _requester,
          challenger: _challenger
        }
    }

    Object.keys(cachedTokens.items).forEach(tokenID => {
      const token = cachedTokens.items[tokenID]
      token.clientStatus = contractStatusToClientStatus(
        token.status.status,
        token.status.disputed
      )
      token.name = !token.name ? '0x' : token.name
      token.ticker = !token.ticker ? '0x' : token.ticker
      if (cachedTokens.addressToIDs[token.address])
        cachedTokens.addressToIDs[token.address].push(tokenID)
      else cachedTokens.addressToIDs[token.address] = [tokenID]
    })

    // Mark items in appeal period.
    // Fetch token disputes in appeal period.
    const disputesInAppealPeriod = yield call(
      fetchAppealable,
      arbitratorView,
      ARBITRATOR_BLOCK,
      arbitrableTokenListView
    )

    // The appeal period can also be over if the arbitrators gave
    // a decisive ruling (did not refuse or failed to rule) and the
    // loser of the previous round did not get fully funded in within
    // the first half of the appeal period.
    // Remove items that fall under that category.
    const tokenIDsInAppealPeriod = {}
    for (const disputeID of Object.keys(disputesInAppealPeriod)) {
      // To do this we must:
      // 1- Find out which side lost the previous round.
      // 2- Find out if the loser received enough arbitration fees.

      // 1- Find out which party lost the previous round.
      const currentRuling = Number(
        yield call(arbitratorView.methods.currentRuling(disputeID).call)
      )
      const tokenID = yield call(
        arbitrableTokenListView.methods.arbitratorDisputeIDToTokenID(
          arbitratorView._address,
          disputeID
        ).call
      )

      // If there was no decisive ruling, there is no loser and the rule does not apply.
      if (currentRuling === tcrConstants.RULING_OPTIONS.None) {
        tokenIDsInAppealPeriod[tokenID] = true
        continue
      }

      const loser =
        currentRuling === tcrConstants.RULING_OPTIONS.Accept
          ? tcrConstants.SIDE.Challenger
          : tcrConstants.SIDE.Requester

      // 2- We start by fetching information on the latest round.
      const numberOfRequests = Number(
        (yield call(arbitrableTokenListView.methods.getTokenInfo(tokenID).call))
          .numberOfRequests
      )
      const numberOfRounds = Number(
        (yield call(
          arbitrableTokenListView.methods.getRequestInfo(
            tokenID,
            numberOfRequests - 1
          ).call
        )).numberOfRounds
      )
      const latestRound = yield call(
        arbitrableTokenListView.methods.getRoundInfo(
          tokenID,
          numberOfRequests - 1,
          numberOfRounds - 1
        ).call
      )

      const loserPaid = latestRound.hasPaid[loser]
      const appealPeriodStart = disputesInAppealPeriod[disputeID][0]
      const appealPeriodEnd = disputesInAppealPeriod[disputeID][1]
      const endOfHalf =
        appealPeriodStart + (appealPeriodEnd - appealPeriodStart) / 2

      tokenIDsInAppealPeriod[tokenID] =
        endOfHalf * 1000 > Date.now() ||
        (loserPaid && Date.now() < appealPeriodEnd * 1000)
    }

    // Update appealPeriod state of each item.
    for (const tokenID of Object.keys(cachedTokens.items))
      cachedTokens.items[tokenID].inAppealPeriod = !!tokenIDsInAppealPeriod[
        tokenID
      ]

    localStorage.setItem(
      `${arbitrableTokenListView.options.address}tokens@${APP_VERSION}`,
      JSON.stringify(cachedTokens)
    )

    yield put(cacheTokens(cachedTokens))
  } catch (err) {
    if (err.message === 'Returned error: request failed or timed out')
      // This is a web3js bug. https://github.com/ethereum/web3.js/issues/2311
      // We can't upgrade to version 37 as suggested because we hit bug https://github.com/ethereum/web3.js/issues/1802.
      // Work around it by just trying again.
      yield put({ type: FETCH_TOKENS_CACHE })
    else {
      console.error('Error fetching tokens ', err)
      yield put(fetchTokensFailed())
    }
  }
}

/**
 * The root of the tokens saga.
 */
export default function* actionWatcher() {
  yield takeLatest(FETCH_TOKENS_CACHE, fetchTokens)
}
