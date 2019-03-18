import { all, call, select, takeLatest } from 'redux-saga/effects'

import { lessduxSaga } from '../utils/saga'
import { sanitize } from '../utils/ui'
import {
  arbitrableTokenList,
  arbitrator,
  archon,
  web3
} from '../bootstrap/dapp-api'
import * as arbitrableTokenListActions from '../actions/arbitrable-token-list'
import * as tcrConstants from '../constants/tcr'
import * as walletSelectors from '../reducers/wallet'
import readFile from '../utils/read-file'

import ipfsPublish from './api/ipfs-publish'

const { toBN } = web3.utils

/**
 * Fetches the arbitrable token list's data.
 * @param {{ type: string, payload: ?object, meta: ?object }} action - The action object.
 * @returns {object} - The fetched data.
 */
export function* fetchArbitrableTokenListData() {
  const d = yield all({
    arbitrator: call(arbitrableTokenList.methods.arbitrator().call),
    requesterBaseDeposit: call(
      arbitrableTokenList.methods.requesterBaseDeposit().call
    ),
    challengerBaseDeposit: call(
      arbitrableTokenList.methods.challengerBaseDeposit().call
    ),
    challengePeriodDuration: call(
      arbitrableTokenList.methods.challengePeriodDuration().call
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
    MULTIPLIER_DIVISOR: call(
      arbitrableTokenList.methods.MULTIPLIER_DIVISOR().call
    ),
    arbitratorExtraData: call(
      arbitrableTokenList.methods.arbitratorExtraData().call
    ),
    countByStatus: call(arbitrableTokenList.methods.countByStatus().call)
  })

  arbitrator.options.address = d.arbitrator
  const arbitrationCost = yield call(
    arbitrator.methods.arbitrationCost(d.arbitratorExtraData).call
  )

  return {
    arbitrator: d.arbitrator,
    governor: d.governor,
    requesterBaseDeposit: toBN(d.requesterBaseDeposit),
    challengerBaseDeposit: toBN(d.challengerBaseDeposit),
    challengePeriodDuration: Number(d.challengePeriodDuration) * 1000, // Time in js is milliseconds.
    arbitrationCost: toBN(arbitrationCost),
    winnerStakeMultiplier: toBN(d.winnerStakeMultiplier),
    loserStakeMultiplier: toBN(d.loserStakeMultiplier),
    sharedStakeMultiplier: toBN(d.sharedStakeMultiplier),
    MULTIPLIER_DIVISOR: toBN(d.MULTIPLIER_DIVISOR),
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
function* submitTokenEvidence({ payload: { evidenceData, file, ID } }) {
  if (!ID) throw new Error('No selected token ID')

  let fileURI = ''
  let fileTypeExtension = ''

  /* eslint-disable unicorn/number-literal-case */
  if (file) {
    fileTypeExtension = file.name.split('.')[1]
    const data = yield call(readFile, file.preview)
    const ipfsFileObj = yield call(ipfsPublish, sanitize(file.name), data)
    fileURI = `/ipfs/${ipfsFileObj[1].hash}${ipfsFileObj[0].path}`
  }
  /* eslint-enable */

  const evidenceJSON = {
    title: evidenceData.title,
    description: evidenceData.description,
    fileURI,
    fileTypeExtension
  }

  /* eslint-disable unicorn/number-literal-case */
  const evidenceJSONMultihash = archon.utils.multihashFile(evidenceJSON, 0x1b) // 0x1b is keccak-256
  /* eslint-enable */

  const enc = new TextEncoder()
  const ipfsHashEvidenceObj = yield call(
    ipfsPublish,
    evidenceJSONMultihash,
    enc.encode(JSON.stringify(evidenceJSON))
  )

  const ipfsHashEvidence =
    ipfsHashEvidenceObj[1].hash + ipfsHashEvidenceObj[0].path

  yield call(
    arbitrableTokenList.methods.submitEvidence(ID, `/ipfs/${ipfsHashEvidence}`)
      .send,
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
    arbitrableTokenListActions.tokenEvidence.CREATE,
    lessduxSaga,
    {
      flow: 'create',
      collection: arbitrableTokenListActions.tokenEvidence.self
    },
    arbitrableTokenListActions.tokenEvidence,
    submitTokenEvidence
  )
}
