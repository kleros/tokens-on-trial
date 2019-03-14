import { put, takeLatest, select, call } from 'redux-saga/effects'

import { FETCH_TOKENS_CACHE, CACHE_TOKENS } from '../actions/tokens'
import * as tokenSelectors from '../reducers/tokens'
import { arbitrableTokenList, web3 } from '../bootstrap/dapp-api'
import { contractStatusToClientStatus } from '../utils/tcr'

const fetchEvents = async (eventName, fromBlock) =>
  arbitrableTokenList.getPastEvents(eventName, { fromBlock })

/**
 * Fetches a paginatable list of tokens.
 * @param {{ type: string, payload: ?object, meta: ?object }} action - The action object.
 */
function* fetchTokens() {
  const tokens = (yield select(tokenSelectors.getTokens)).data
  const submissionEvents = yield call(
    fetchEvents,
    'TokenSubmitted',
    tokens.blockNumber
  )

  const blockNumber = submissionEvents.reduce((acc, event) => {
    const { blockNumber } = event
    return blockNumber > acc ? blockNumber : acc
  }, 0)

  const missingTokens = []
  const receivedTokens = submissionEvents.reduce(
    (acc, event) => {
      const { returnValues } = event
      const { _name, _ticker, _symbolMultihash, _address } = returnValues

      // Web3js does not handle the string "0x" well and returns null. This
      // is a problem for the case of the ZRX token (previously, 0x), where a
      // party may submit it as either the name or the ticker.
      // The result is that we cannot properly calculate the tokenID with
      // web3.utils.soliditySha3.
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
          arbitrableTokenList.methods.getTokenInfo(_tokenID).call
        )
        if (
          tokenInfo.name === missingToken.name &&
          tokenInfo.ticker === missingToken.ticker &&
          tokenInfo.address === missingToken.addr &&
          tokenInfo.symbolMultihash === missingToken.symbolMultihash
        ) {
          missingToken.name = missingToken.name || '0x'
          missingToken.ticker = missingToken.ticker || '0x'
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
    if (cachedTokens.addressToIDs[token.address])
      cachedTokens.addressToIDs[token.address].push(tokenID)
    else cachedTokens.addressToIDs[token.address] = [tokenID]
  })

  yield put({ type: CACHE_TOKENS, payload: { tokens: cachedTokens } })
}

/**
 * The root of the tokens saga.
 */
export default function* actionWatcher() {
  yield takeLatest(FETCH_TOKENS_CACHE, fetchTokens)
}
