import { all, call, select, takeLatest } from 'redux-saga/effects'

import { lessduxSaga } from '../utils/saga'
import { sanitize } from '../utils/ui'
import * as arbitrableTokenListActions from '../actions/arbitrable-token-list'
import * as tcrConstants from '../constants/tcr'
import * as walletSelectors from '../reducers/wallet'
import readFile from '../utils/read-file'
import { web3Utils } from '../bootstrap/dapp-api'
import { instantiateEnvObjects } from '../utils/tcr'

import ipfsPublish from './api/ipfs-publish'

const { toBN } = web3Utils

/**
 * Fetches the arbitrable token list's data.
 * @param {{ type: string, payload: ?object, meta: ?object }} action - The action object.
 * @returns {object} - The fetched data.
 */
export function* fetchArbitrableTokenListData() {
  const { arbitrableTokenListView, arbitratorView } = yield call(
    instantiateEnvObjects
  )

  const d = yield all({
    arbitrator: call(arbitrableTokenListView.methods.arbitrator().call),
    requesterBaseDeposit: call(
      arbitrableTokenListView.methods.requesterBaseDeposit().call
    ),
    challengerBaseDeposit: call(
      arbitrableTokenListView.methods.challengerBaseDeposit().call
    ),
    challengePeriodDuration: call(
      arbitrableTokenListView.methods.challengePeriodDuration().call
    ),
    governor: call(arbitrableTokenListView.methods.governor().call),
    winnerStakeMultiplier: call(
      arbitrableTokenListView.methods.winnerStakeMultiplier().call
    ),
    loserStakeMultiplier: call(
      arbitrableTokenListView.methods.loserStakeMultiplier().call
    ),
    sharedStakeMultiplier: call(
      arbitrableTokenListView.methods.sharedStakeMultiplier().call
    ),
    MULTIPLIER_DIVISOR: call(
      arbitrableTokenListView.methods.MULTIPLIER_DIVISOR().call
    ),
    arbitratorExtraData: call(
      arbitrableTokenListView.methods.arbitratorExtraData().call
    ),
    countByStatus: call(arbitrableTokenListView.methods.countByStatus().call)
  })

  arbitratorView.options.address = d.arbitrator
  const arbitrationCost = yield call(
    arbitratorView.methods.arbitrationCost(d.arbitratorExtraData).call
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

  const { arbitrableTokenList, archon } = yield call(instantiateEnvObjects)

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
