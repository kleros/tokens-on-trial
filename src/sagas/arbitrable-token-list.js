import piexif from 'piexifjs'
import JSZip from 'jszip'

import { all, call, select, takeLatest } from 'redux-saga/effects'

import { lessduxSaga } from '../utils/saga'
import { sanitize } from '../utils/ui'
import * as arbitrableTokenListActions from '../actions/arbitrable-token-list'
import * as tcrConstants from '../constants/tcr'
import * as walletSelectors from '../reducers/wallet'
import readFile from '../utils/read-file'
import { web3Utils, IPFS_URL } from '../bootstrap/dapp-api'
import { instantiateEnvObjects } from '../utils/tcr'
import asyncReadFile from '../utils/async-file-reader'

import ipfsPublish from './api/ipfs-publish'

const { toBN } = web3Utils

const fetchEvents = async (eventName, contract, fromBlock) =>
  contract.getPastEvents(eventName, { fromBlock: fromBlock || 0 }) // Web3js returns an empty array if fromBlock is not set.

/**
 * Fetches the arbitrable token list's data.
 * @param {{ type: string, payload: ?object, meta: ?object }} action - The action object.
 * @returns {object} - The fetched data.
 */
export function* fetchArbitrableTokenListData() {
  const { arbitrableTokenListView, arbitratorView } = yield call(
    instantiateEnvObjects
  )

  // Fetch the contract deployment block number. We use the first meta evidence
  // events emitted when the constructor is run.
  // TODO: Cache this.
  const metaEvidenceEvents = (yield call(
    fetchEvents,
    'MetaEvidence',
    arbitrableTokenListView
  )).sort((a, b) => a.blockNumber - b.blockNumber)
  const blockNumber = metaEvidenceEvents[0].blockNumber

  // Fetch tcr information from the latest meta evidence event
  const metaEvidencePath = `${IPFS_URL}${
    metaEvidenceEvents[metaEvidenceEvents.length - 1].returnValues._evidence
  }`
  const metaEvidence = yield (yield call(fetch, metaEvidencePath)).json()
  const { fileURI } = metaEvidence

  // TODO: Cache this to speed up future loads.
  const evidenceEvents = (yield call(
    fetchEvents,
    'Evidence',
    arbitrableTokenListView,
    blockNumber
  )).reduce((acc, curr) => {
    const {
      returnValues: { _evidenceGroupID }
    } = curr
    acc[_evidenceGroupID] = acc[_evidenceGroupID] ? acc[_evidenceGroupID] : []
    acc[_evidenceGroupID].push(curr)
    return acc
  }, {})

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
    blockNumber,
    fileURI,
    evidenceEvents,
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
