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
import asyncReadFile from '../utils/async-file-reader'
import ipfsPublish from './api/ipfs-publish'
import { fetchEvents } from './utils'

const { toBN } = web3Utils

/**
 * Fetches the arbitrable address list data.
 * @param { object } arbitrableAddressListView - The contract.
 * @param { object } arbitrableTCRView - View contract to fetch arbitrable data in a batch.
 * @param { object } viewWeb3 - View only provider.
 * @returns {object} - The fetched data.
 */
export function* fetchBadgeContractData(
  arbitrableAddressListView,
  arbitrableTCRView,
  viewWeb3
) {
  // Initial cache object.
  // This gets overwritten if there is cached data available.
  const eventsData = {
    metaEvidenceEvents: {
      blockNumber: 0,
      events: [],
    },
    evidenceEvents: {
      blockNumber: 0,
    },
    requestSubmittedEvents: {
      blockNumber: 0,
    },
    disputeEvents: {
      blockNumber: 0,
    },
    allEvents: {},
  }

  eventsData.allEvents.events = (yield call(
    fetchEvents,
    'allEvents',
    arbitrableAddressListView,
    0,
    viewWeb3
  )).sort((a, b) => a.blockNumber - b.blockNumber)
  eventsData.metaEvidenceEvents.events = eventsData.allEvents.events.filter(
    (e) => e.event === 'MetaEvidence'
  )

  // Fetch tcr information from the latest meta evidence event
  const metaEvidencePath = `${IPFS_URL}${
    eventsData.metaEvidenceEvents.events[
      eventsData.metaEvidenceEvents.events.length - 1
    ].returnValues._evidence
  }`
  const metaEvidence = yield (yield call(fetch, metaEvidencePath)).json()

  const { fileURI, variables } = metaEvidence
  eventsData.evidenceEvents = eventsData.allEvents.events
    .filter((e) => e.event === 'Evidence')
    .reduce((acc, curr) => {
      const { returnValues } = curr
      const { _evidenceGroupID } = returnValues

      acc[_evidenceGroupID] = acc[_evidenceGroupID] ? acc[_evidenceGroupID] : []
      acc[_evidenceGroupID].push({
        returnValues: curr.returnValues,
        transactionHash: curr.transactionHash,
        blockNumber: curr.blockNumber,
      })
      return acc
    }, eventsData.evidenceEvents)

  eventsData.requestSubmittedEvents = eventsData.allEvents.events
    .filter((e) => e.event === 'RequestSubmitted')
    .reduce((acc, curr) => {
      if (!acc[curr.returnValues._address]) acc[curr.returnValues._address] = []

      acc[curr.returnValues._address].push({
        returnValues: curr.returnValues,
        transactionHash: curr.transactionHash,
        blockNumber: curr.blockNumber,
      })

      return acc
    }, eventsData.requestSubmittedEvents)

  eventsData.disputeEvents = eventsData.allEvents.events
    .filter((e) => e.event === 'Dispute')
    .reduce((acc, curr) => {
      const {
        returnValues: { _evidenceGroupID },
      } = curr

      if (curr.blockNumber > eventsData.disputeEvents.blockNumber)
        eventsData.disputeEvents.blockNumber = curr.blockNumber + 1

      acc[_evidenceGroupID] = {
        returnValues: curr.returnValues,
        transactionHash: curr.transactionHash,
        blockNumber: curr.blockNumber,
      }
      return acc
    }, eventsData.disputeEvents)

  const d = yield call(
    arbitrableTCRView.methods.fetchArbitrable(
      arbitrableAddressListView.options.address
    ).call
  )
  const { arbitrationCost } = d

  return {
    blockNumber: eventsData.metaEvidenceEvents.blockNumber,
    variables,
    fileURI,
    evidenceEvents: eventsData.evidenceEvents,
    requestSubmittedEvents: eventsData.requestSubmittedEvents,
    disputeEvents: eventsData.disputeEvents,
    badgeContractAddr: arbitrableAddressListView.options.address,
    arbitrator: d.arbitrator,
    governor: d.governor,
    arbitratorExtraData: d.arbitratorExtraData,
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
    ),
  }
}

/**
 * Fetches the badge contract data for every badge contract.
 * @param {{ type: string, payload: ?object, meta: ?object }} action - The action object.
 * @returns {object} - The fetched data.
 */
export function* fetchArbitrableAddressListData() {
  const { badgeViewContracts, arbitrableTCRView, viewWeb3 } = yield call(
    instantiateEnvObjects
  )

  const badgeContractsData = (yield all(
    Object.keys(badgeViewContracts).map((address) =>
      call(
        fetchBadgeContractData,
        badgeViewContracts[address],
        arbitrableTCRView,
        viewWeb3
      )
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
  payload: {
    evidenceData,
    file,
    tokenAddress,
    badgeContractAddr,
    evidenceSide,
  },
}) {
  const { badgeContracts } = yield call(instantiateEnvObjects)
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

      xmlObject.querySelectorAll('dc:creator')[0].childNodes[0].nodeValue = ''
      xmlObject.querySelectorAll(
        'cp:lastModifiedBy'
      )[0].childNodes[0].nodeValue = ''
      xmlObject.querySelectorAll(
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
    evidenceSide,
  }

  const enc = new TextEncoder()
  const ipfsHashEvidenceObj = yield call(
    ipfsPublish,
    'evidence.json',
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
      from: yield select(walletSelectors.getAccount),
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
      collection: arbitrableAddressListActions.badgeEvidence.self,
    },
    arbitrableAddressListActions.badgeEvidence,
    submitBadgeEvidence
  )
}
