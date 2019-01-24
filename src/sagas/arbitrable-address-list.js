import * as mime from 'mime-types'

import { all, call, select, takeLatest } from 'redux-saga/effects'

import { lessduxSaga } from '../utils/saga'
import {
  arbitrableAddressList,
  arbitrator,
  archon
} from '../bootstrap/dapp-api'
import * as arbitrableAddressListActions from '../actions/arbitrable-address-list'
import * as tcrConstants from '../constants/tcr'
import * as walletSelectors from '../reducers/wallet'

import storeApi from './api/store'

/**
 * Fetches the arbitrable address list's data.
 * @param {{ type: string, payload: ?object, meta: ?object }} action - The action object.
 * @returns {object} - The fetched data.
 */
export function* fetchArbitrableAddressListData() {
  const d = yield all({
    arbitrator: call(arbitrableAddressList.methods.arbitrator().call),
    challengeReward: call(arbitrableAddressList.methods.challengeReward().call),
    challengePeriodDuration: call(
      arbitrableAddressList.methods.challengePeriodDuration().call
    ),
    arbitrationFeesWaitingTime: call(
      arbitrableAddressList.methods.arbitrationFeesWaitingTime().call
    ),
    governor: call(arbitrableAddressList.methods.governor().call),
    winnerStakeMultiplier: call(
      arbitrableAddressList.methods.winnerStakeMultiplier().call
    ),
    loserStakeMultiplier: call(
      arbitrableAddressList.methods.loserStakeMultiplier().call
    ),
    sharedStakeMultiplier: call(
      arbitrableAddressList.methods.sharedStakeMultiplier().call
    ),
    MULTIPLIER_PRECISION: call(
      arbitrableAddressList.methods.MULTIPLIER_PRECISION().call
    ),
    countByStatus: call(arbitrableAddressList.methods.countByStatus().call)
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
    countByStatus: tcrConstants.IN_CONTRACT_STATUS_ENUM.values.reduce(
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
function* submitBadgeEvidence({
  payload: { evidenceData, file, ID, fileData }
}) {
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

  yield call(
    arbitrableAddressList.methods.submitEvidence(ID, evidenceJSONURL).send,
    {
      from: yield select(walletSelectors.getAccount)
    }
  )

  return evidenceJSON
}

/**
 * The root of the arbitrable token list saga.
 */
export default function* arbitrableAddressListSaga() {
  // Arbitrable Address List Data
  yield takeLatest(
    arbitrableAddressListActions.arbitrableAddressListData.FETCH,
    lessduxSaga,
    'fetch',
    arbitrableAddressListActions.arbitrableAddressListData,
    fetchArbitrableAddressListData
  )
  // Actions
  yield takeLatest(
    arbitrableAddressListActions.badgeEvidence.CREATE,
    lessduxSaga,
    {
      flow: 'create',
      collection: arbitrableAddressListActions.badgeEvidence.self
    },
    arbitrableAddressListActions.badgeEvidence,
    submitBadgeEvidence
  )
}
