import { all, call, select, takeLatest } from 'redux-saga/effects'

import { lessduxSaga } from '../utils/saga'
import readFile from '../utils/read-file'
import { sanitize } from '../utils/ui'
import * as arbitrableAddressListActions from '../actions/arbitrable-address-list'
import * as tcrConstants from '../constants/tcr'
import * as walletSelectors from '../reducers/wallet'
import { web3Utils, IPFS_URL } from '../bootstrap/dapp-api'
import { instantiateEnvObjects } from '../utils/tcr'
import Arbitrator from '../assets/contracts/arbitrator'

import ipfsPublish from './api/ipfs-publish'

const { toBN } = web3Utils

const fetchEvents = async (eventName, contract) =>
  contract.getPastEvents(eventName, { fromBlock: 0 }) // Web3js returns an empty array if fromBlock is not set.

/**
 * Fetches the arbitrable address list data.
 * @param { object } arbitrableAddressListView - The contract.
 * @param { object } viewWeb3 - Web3 object for instantiating an arbitrator.
 * @returns {object} - The fetched data.
 */
export function* fetchBadgeContractData(arbitrableAddressListView, viewWeb3) {
  // Fetch the contract deployment block number. We use the first meta evidence
  // events emitted when the constructor is run.
  const metaEvidenceEvents = (yield call(
    fetchEvents,
    'MetaEvidence',
    arbitrableAddressListView
  )).sort((a, b) => a.blockNumber - b.blockNumber)
  const blockNumber = metaEvidenceEvents[0].blockNumber

  // Fetch tcr information from the latest meta evidence event
  const metaEvidencePath = `${IPFS_URL}${
    metaEvidenceEvents[metaEvidenceEvents.length - 1].returnValues._evidence
  }`
  const { variables, fileURI } = yield (yield call(
    fetch,
    metaEvidencePath
  )).json()

  const d = yield all({
    arbitrator: call(arbitrableAddressListView.methods.arbitrator().call),
    requesterBaseDeposit: call(
      arbitrableAddressListView.methods.requesterBaseDeposit().call
    ),
    challengerBaseDeposit: call(
      arbitrableAddressListView.methods.challengerBaseDeposit().call
    ),
    challengePeriodDuration: call(
      arbitrableAddressListView.methods.challengePeriodDuration().call
    ),
    winnerStakeMultiplier: call(
      arbitrableAddressListView.methods.winnerStakeMultiplier().call
    ),
    loserStakeMultiplier: call(
      arbitrableAddressListView.methods.loserStakeMultiplier().call
    ),
    sharedStakeMultiplier: call(
      arbitrableAddressListView.methods.sharedStakeMultiplier().call
    ),
    MULTIPLIER_DIVISOR: call(
      arbitrableAddressListView.methods.MULTIPLIER_DIVISOR().call
    ),
    arbitratorExtraData: call(
      arbitrableAddressListView.methods.arbitratorExtraData().call
    ),
    countByStatus: call(arbitrableAddressListView.methods.countByStatus().call)
  })

  const arbitratorView = new viewWeb3.eth.Contract(Arbitrator.abi, d.arbitrator)
  const arbitrationCost = yield call(
    arbitratorView.methods.arbitrationCost(d.arbitratorExtraData).call
  )

  return {
    blockNumber,
    variables,
    fileURI,
    badgeContractAddr: arbitrableAddressListView.options.address,
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
 * Fetches the badge contract data for every badge contract.
 * @param {{ type: string, payload: ?object, meta: ?object }} action - The action object.
 * @returns {object} - The fetched data.
 */
export function* fetchArbitrableAddressListData() {
  const { badgeViewContracts, viewWeb3 } = yield call(instantiateEnvObjects)

  const badgeContractsData = (yield all(
    Object.keys(badgeViewContracts).map(address =>
      call(fetchBadgeContractData, badgeViewContracts[address], viewWeb3)
    )
  )).reduce((acc, curr) => {
    acc[curr.badgeContractAddr] = curr
    return acc
  }, {})

  return badgeContractsData
}

/**
 * Submits evidence for a dispute
 * @param {{ type: string, payload: ?object, meta: ?object }} action - The action object.
 * @returns {object} - The `lessdux` collection mod object for updating the list of tokens.
 */
function* submitBadgeEvidence({
  payload: { evidenceData, file, tokenAddress, badgeContractAddr }
}) {
  const { badgeContracts, archon } = yield call(instantiateEnvObjects)
  const arbitrableAddressList = badgeContracts[badgeContractAddr]

  let fileURI = ''
  let fileTypeExtension = ''
  const multihash = ''

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
      tokenAddress,
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
