import localforage from 'localforage'

import { put, takeLatest, call, all } from 'redux-saga/effects'

import * as tokensActions from '../actions/tokens'
import * as badgesActions from '../actions/badges'
import { web3Utils, APP_VERSION } from '../bootstrap/dapp-api'
import {
  contractStatusToClientStatus,
  instantiateEnvObjects
} from '../utils/tcr'

import { fetchEvents, fetchAppealableTokens } from './utils'

/**
 * Fetches token and status information by events and dispatches a `fetchBadges` action.
 * @param {{ type: string, payload: ?object, meta: ?object }} action - The action object.
 */
function* fetchTokens() {
  const {
    arbitrableTokenListView,
    T2CR_BLOCK,
    arbitrableTCRView,
    viewWeb3
  } = yield call(instantiateEnvObjects)

  try {
    let tokens = yield localforage.getItem(
      `${arbitrableTokenListView.options.address}tokens@${APP_VERSION}`
    )

    if (!tokens)
      tokens = {
        blockNumber: T2CR_BLOCK,
        statusBlockNumber: T2CR_BLOCK,
        items: {},
        addressToIDs: {}
      }
    // Display cached state while fetching latest.
    else yield put(tokensActions.cacheTokens(tokens))

    const [events, tokensInAppealPeriod] = yield all([
      call(
        fetchEvents,
        'allEvents',
        arbitrableTokenListView,
        0,
        viewWeb3,
        500000
      ),
      call(fetchAppealableTokens, arbitrableTokenListView, arbitrableTCRView)
    ])
    const submissionEvents = events.filter(e => e.event === 'TokenSubmitted')

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
    const statusChanges = events.filter(e => e.event === 'TokenStatusChange')

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

    // Update appealPeriod state of each item.
    for (const tokenID of Object.keys(cachedTokens.items))
      cachedTokens.items[tokenID].inAppealPeriod = !!tokensInAppealPeriod[
        tokenID
      ]

    yield put(tokensActions.cacheTokens(cachedTokens))
    yield put(badgesActions.fetchBadges())

    localforage.setItem(
      `${arbitrableTokenListView.options.address}tokens@${APP_VERSION}`,
      cachedTokens
    )
  } catch (err) {
    console.error('Error fetching tokens ', err)
    if (err === `Error: Returned values aren't valid, did it run Out of Gas?`) {
      // Infura just refused our request. try again.
      console.info('Infura just refused the request. Attempting fetch again.')
      yield put(tokensActions.fetchTokens())
    } else yield put(tokensActions.fetchTokensFailed())
  }
}

/**
 * The root of the tokens saga.
 */
export default function* actionWatcher() {
  yield takeLatest(tokensActions.FETCH_TOKENS_CACHE, fetchTokens)
}
