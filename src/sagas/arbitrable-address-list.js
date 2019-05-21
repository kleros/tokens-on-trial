import piexif from 'piexifjs'
import JSZip from 'jszip'

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
import asyncReadFile from '../utils/async-file-reader'

import ipfsPublish from './api/ipfs-publish'

const { toBN } = web3Utils

const fetchEvents = async (eventName, contract, fromBlock) =>
  contract.getPastEvents(eventName, { fromBlock: fromBlock || 0 }) // Web3js returns an empty array if fromBlock is not set.

/**
 * Fetches the arbitrable address list data.
 * @param { object } arbitrableAddressListView - The contract.
 * @param { object } viewWeb3 - Web3 object for instantiating an arbitrator.
 * @returns {object} - The fetched data.
 */
export function* fetchBadgeContractData(arbitrableAddressListView, viewWeb3) {
  // Fetch the contract deployment block number. We use the first meta evidence
  // events emitted when the constructor is run.
  // TODO: Cache this to speed up future loads.
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
  const metaEvidence = yield (yield call(fetch, metaEvidencePath)).json()

  const { fileURI, variables } = metaEvidence
  // TODO: Cache this to speed up future loads.
  const evidenceEvents = (yield call(
    fetchEvents,
    'Evidence',
    arbitrableAddressListView,
    blockNumber
  )).reduce((acc, curr) => {
    const { returnValues } = curr
    const { _evidenceGroupID } = returnValues
    acc[_evidenceGroupID] = acc[_evidenceGroupID] ? acc[_evidenceGroupID] : []
    acc[_evidenceGroupID].push(curr)
    return acc
  }, {})

  // TODO: Cache this to speed up future loads.
  const requestSubmittedEvents = (yield call(
    fetchEvents,
    'RequestSubmitted',
    arbitrableAddressListView,
    blockNumber
  )).reduce((acc, curr) => {
    if (!acc[curr.returnValues._address]) acc[curr.returnValues._address] = []

    acc[curr.returnValues._address].push(curr)
    return acc
  }, {})

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
    evidenceEvents,
    requestSubmittedEvents,
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
  payload: { evidenceData, file, tokenAddress, badgeContractAddr, evidenceSide }
}) {
  const { badgeContracts, archon } = yield call(instantiateEnvObjects)
  const arbitrableAddressList = badgeContracts[badgeContractAddr]

  let fileURI = ''
  let fileTypeExtension = ''
  const multihash = ''

  /* eslint-disable unicorn/number-literal-case */
  if (file) {
    fileTypeExtension = file.name.split('.')[1]
    let data = yield call(readFile, file.preview)
    if (fileTypeExtension === 'jpg' || fileTypeExtension === 'jpeg') {
      // Strip exif data.
      const blob = yield (yield call(fetch, file.preview)).blob()
      const newDataString = piexif.remove((yield call(asyncReadFile, blob))[0])
      data = yield call(readFile, newDataString)
    } else if (fileTypeExtension === 'docx' || fileTypeExtension === 'xlsx') {
      // Docx files are zip files. We can remove sensitive information from the core.xml file inside docProps.
      const blob = yield (yield call(fetch, file.preview)).blob()
      const base64Data = (yield call(asyncReadFile, blob))[0].split(',')[1]

      const zip = yield JSZip.loadAsync(base64Data, { base64: true })
      const xmlString = yield zip.file('docProps/core.xml').async('text')
      const xmlObject = new DOMParser().parseFromString(xmlString, 'text/xml')

      xmlObject.getElementsByTagName('dc:creator')[0].childNodes[0].nodeValue =
        ''
      xmlObject.getElementsByTagName(
        'cp:lastModifiedBy'
      )[0].childNodes[0].nodeValue = ''
      xmlObject.getElementsByTagName(
        'cp:lastModifiedBy'
      )[0].childNodes[0].nodeValue = ''

      const xmlDocString = new XMLSerializer().serializeToString(
        xmlObject.documentElement
      )
      zip.file('docProps/core.xml', xmlDocString)
      data = yield zip.generateAsync({ type: 'arraybuffer' })
    }

    const ipfsFileObj = yield call(ipfsPublish, sanitize(file.name), data)
    fileURI = `/ipfs/${ipfsFileObj[1].hash}${ipfsFileObj[0].path}`
  }
  /* eslint-enable */

  const evidenceJSON = {
    title: evidenceData.title,
    description: evidenceData.description,
    fileURI,
    fileHash: multihash,
    fileTypeExtension,
    evidenceSide
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
