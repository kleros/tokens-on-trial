import { all, call, select, takeLatest } from 'redux-saga/effects'

import { lessduxSaga } from '../utils/saga'
import readFile from '../utils/read-file'
import {
  arbitrableAddressList,
  arbitrator,
  archon,
  web3
} from '../bootstrap/dapp-api'
import * as arbitrableAddressListActions from '../actions/arbitrable-address-list'
import * as tcrConstants from '../constants/tcr'
import * as walletSelectors from '../reducers/wallet'

import ipfsPublish from './api/ipfs-publish'

const { toBN } = web3.utils

/**
 * Fetches the arbitrable address list's data.
 * @param {{ type: string, payload: ?object, meta: ?object }} action - The action object.
 * @returns {object} - The fetched data.
 */
export function* fetchArbitrableAddressListData() {
  const d = yield all({
    arbitrator: call(arbitrableAddressList.methods.arbitrator().call),
    requesterBaseDeposit: call(
      arbitrableAddressList.methods.requesterBaseDeposit().call
    ),
    challengerBaseDeposit: call(
      arbitrableAddressList.methods.challengerBaseDeposit().call
    ),
    challengePeriodDuration: call(
      arbitrableAddressList.methods.challengePeriodDuration().call
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
    MULTIPLIER_DIVISOR: call(
      arbitrableAddressList.methods.MULTIPLIER_DIVISOR().call
    ),
    arbitratorExtraData: call(
      arbitrableAddressList.methods.arbitratorExtraData().call
    ),
    countByStatus: call(arbitrableAddressList.methods.countByStatus().call)
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
function* submitBadgeEvidence({ payload: { evidenceData, file, addr } }) {
  let fileURI = ''
  let fileTypeExtension = ''
  const multihash = ''

  /* eslint-disable unicorn/number-literal-case */
  if (file) {
    fileTypeExtension = file.name.split('.')[1]
    const data = yield call(readFile, file.preview)
    const ipfsFileObj = yield call(ipfsPublish, file.name, data)
    fileURI = `/ipfs/${ipfsFileObj[1].hash}${ipfsFileObj[0].path}`
  }
  /* eslint-enable */

  const evidenceJSON = {
    title: evidenceData.title,
    description: evidenceData.description,
    fileURI,
    fileHash: multihash,
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
    arbitrableAddressList.methods.submitEvidence(
      addr,
      `/ipfs/${ipfsHashEvidence}`
    ).send,
    {
      from: yield select(walletSelectors.getAccount)
    }
  )

  return evidenceJSON
}

/**
 * The root of the arbitrable address list saga.
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
