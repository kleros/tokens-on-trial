import * as mime from 'mime-types'

import { takeLatest, call, all, select } from 'redux-saga/effects'

import { lessduxSaga } from '../utils/saga'
import { arbitrableTokenList, arbitrator, archon } from '../bootstrap/dapp-api'
import * as arbitrableTokenListActions from '../actions/arbitrable-token-list'
import * as tokenConstants from '../constants/token'
import * as evidenceActions from '../actions/evidence'
import * as walletSelectors from '../reducers/wallet'

import storeApi from './api/store'

/**
 * Fetches the arbitrable token list's data.
 * @param {{ type: string, payload: ?object, meta: ?object }} action - The action object.
 * @returns {object} - The fetched data.
 */
export function* fetchArbitrableTokenListData() {
  const d = yield all({
    arbitrator: call(arbitrableTokenList.methods.arbitrator().call),
    challengeReward: call(arbitrableTokenList.methods.challengeReward().call),
    challengePeriodDuration: call(
      arbitrableTokenList.methods.challengePeriodDuration().call
    ),
    arbitrationFeesWaitingTime: call(
      arbitrableTokenList.methods.arbitrationFeesWaitingTime().call
    ),
    governor: call(arbitrableTokenList.methods.governor().call),
    winnerStakeMultiplier: call(
      arbitrableTokenList.methods.winnerStakeMultiplier().call
    ),
    loserStakeMultiplier: call(
      arbitrableTokenList.methods.loserStakeMultiplier().call
    ),
    sharedStakeMultiplier: call(
      arbitrableTokenList.methods.sharedStakeMultiplier().call
    ),
    MULTIPLIER_PRECISION: call(
      arbitrableTokenList.methods.MULTIPLIER_PRECISION().call
    ),
    countByStatus: call(arbitrableTokenList.methods.countByStatus().call)
  })

  arbitrator.options.address = d.arbitrator
  const arbitrationCost = yield call(
    arbitrator.methods.arbitrationCost('0x00').call
  )

  return {
    arbitrator: d.arbitrator,
    governor: d.governor,
    challengeReward: Number(d.challengeReward),
    challengePeriodDuration: Number(d.challengePeriodDuration) * 1000, // Time in js is milliseconds.
    arbitrationFeesWaitingTime: Number(d.arbitrationFeesWaitingTime) * 1000,
    arbitrationCost: Number(arbitrationCost),
    winnerStakeMultiplier: Number(d.winnerStakeMultiplier),
    loserStakeMultiplier: Number(d.loserStakeMultiplier),
    sharedStakeMultiplier: Number(d.sharedStakeMultiplier),
    MULTIPLIER_PRECISION: Number(d.MULTIPLIER_PRECISION),
    countByStatus: tokenConstants.IN_CONTRACT_STATUS_ENUM.values.reduce(
      (acc, value) => {
        acc[value] = Number(d.countByStatus[value.toLowerCase()])
        return acc
      },
      {}
    )
  }
}

/**
 * Submits evidence for a dispute
 * @param {{ type: string, payload: ?object, meta: ?object }} action - The action object.
 * @returns {object} - The `lessdux` collection mod object for updating the list of tokens.
 */
function* submitEvidence({ payload: { evidenceData, file, ID, fileData } }) {
  let evidenceURL = ''
  let fileTypeExtension = ''
  let multihash = ''

  /* eslint-disable unicorn/number-literal-case */
  if (file) {
    multihash = archon.utils.multihashFile(fileData, 0x1b) // keccak-256
    fileTypeExtension = file.name.split('.')[1]
    const mimeType = mime.lookup(fileTypeExtension)
    evidenceURL = (yield call(
      storeApi.postEncodedFile,
      fileData,
      multihash,
      mimeType
    )).payload.fileURL
  }
  /* eslint-enable */

  const evidenceJSON = {
    name: evidenceData.name,
    description: evidenceData.description,
    fileURI: evidenceURL,
    fileHash: multihash,
    fileTypeExtension
  }

  const stringified = JSON.stringify(evidenceJSON)

  /* eslint-disable unicorn/number-literal-case */
  const evidenceJSONHash = archon.utils.multihashFile(
    stringified,
    0x1b // keccak-256
  )
  /* eslint-enable */

  const evidenceJSONURL = (yield call(
    storeApi.postJSONFile,
    stringified,
    evidenceJSONHash
  )).payload.fileURL

  console.info('evidenceJSONURL', evidenceJSONURL)

  yield call(
    arbitrableTokenList.methods.submitEvidence(ID, evidenceJSONURL).send,
    {
      from: yield select(walletSelectors.getAccount)
    }
  )

  return evidenceJSON
}

/**
 * The root of the arbitrable token list saga.
 */
export default function* arbitrableTokenListSaga() {
  // Arbitrable Token List Data
  yield takeLatest(
    arbitrableTokenListActions.arbitrableTokenListData.FETCH,
    lessduxSaga,
    'fetch',
    arbitrableTokenListActions.arbitrableTokenListData,
    fetchArbitrableTokenListData
  )
  // Actions
  yield takeLatest(
    evidenceActions.evidence.CREATE,
    lessduxSaga,
    {
      flow: 'create',
      collection: evidenceActions.evidence.self
    },
    evidenceActions.evidence,
    submitEvidence
  )
}
