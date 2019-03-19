import { put, takeLatest, select, call } from 'redux-saga/effects'

import {
  FETCH_TOKENS_CACHE,
  cacheTokens,
  fetchTokensFailed
} from '../actions/tokens'
import * as tokenSelectors from '../reducers/tokens'
import { arbitrableTokenListView, web3 } from '../bootstrap/dapp-api'
import { contractStatusToClientStatus } from '../utils/tcr'

const fetchEvents = async (eventName, fromBlock) =>
  arbitrableTokenListView.getPastEvents(eventName, { fromBlock })

/**
 * Fetches a paginatable list of tokens.
 * @param {{ type: string, payload: ?object, meta: ?object }} action - The action object.
 */
function* fetchTokens() {
  try {
    const tokens = JSON.parse(
      JSON.stringify((yield select(tokenSelectors.getTokens)).data)
    ) // Deep copy

    const submissionEvents = yield call(
      fetchEvents,
      'TokenSubmitted',
      tokens.blockNumber
    )

    const blockNumber = submissionEvents.reduce((acc, event) => {
      const { blockNumber } = event
      return blockNumber > acc ? blockNumber : acc
    }, tokens.blockNumber + 1)

    const missingTokens = []
    const receivedTokens = submissionEvents.reduce(
      (acc, event) => {
        const { returnValues } = event
        const { _name, _ticker, _symbolMultihash, _address } = returnValues

        // Web3js does not handle the string "0x" well and returns null
        // or an empty string (depending on the web3 js version). This can
        // be a problem for the case of the ZRX token (previously, 0x), where a
        // party may submit it as either the name or the ticker.
        //
        // Additionaly, there is another bug with the web3.utils.soliditySha3 which
        // also does not parse string "0x" correctly as a paramter and calculates the
        // incorrect token ID.
        //
        // We handle these cases manually by merging results from TokenSubmission
        // and TokenStatusChange events.
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

        const tokenID = web3.utils.soliditySha3(
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
          blockNumber: event.blockNumber,
          ID: tokenID,
          status: { blockNumber: 0 }
        }
        return acc
      },
      { ...tokens.items }
    )

    // Get the lastest status change for every token.
    let statusBlockNumber = 0
    const latestStatusChanges = {}
    const statusChanges = yield call(
      fetchEvents,
      'TokenStatusChange',
      tokens.statusBlockNumber
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
      items: {
        ...tokens.items,
        ...receivedTokens
      },
      addressToIDs: {},
      blockNumber,
      statusBlockNumber
    }

    const statusEvents = Object.keys(latestStatusChanges).map(
      tokenID => latestStatusChanges[tokenID]
    )

    for (const event of statusEvents) {
      const { returnValues, blockNumber } = event
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
          if (
            (tokenInfo.name === null || tokenInfo.ticker === null) &&
            tokenInfo.addr === missingToken.address &&
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

      if (blockNumber >= cachedTokens.items[_tokenID].status.blockNumber)
        cachedTokens.items[_tokenID].status = {
          blockNumber,
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
