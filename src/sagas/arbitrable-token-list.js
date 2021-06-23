import piexif from 'piexifjs'
import JSZip from 'jszip'
import { call, select, takeLatest } from 'redux-saga/effects'
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

/**
 * Fetches the arbitrable token list's data.
 * @param {{ type: string, payload: ?object, meta: ?object }} action - The action object.
 * @returns {object} - The fetched data.
 */
export function* fetchArbitrableTokenListData() {
  const {
    arbitrableTokenListView,
    arbitratorView,
    arbitrableTCRView,
    T2CR_BLOCK,
    T2CR_SUBGRAPH_URL,
  } = yield call(instantiateEnvObjects)

  // Fetch tcr information from the latest meta evidence event
  const { data } = yield (yield call(fetch, T2CR_SUBGRAPH_URL, {
    method: 'POST',
    body: JSON.stringify({
      query: `
          {
            registries(first: 5) {
              registrationMetaEvidenceURI
            }
          }
        `,
    }),
  })).json()
  const registry = data.registries[0]

  const metaEvidencePath = `${IPFS_URL}${registry.registrationMetaEvidenceURI}`
  const metaEvidence = yield (yield call(fetch, metaEvidencePath)).json()
  const { fileURI } = metaEvidence

  const d = yield call(
    arbitrableTCRView.methods.fetchArbitrable(
      arbitrableTokenListView.options.address
    ).call
  )
  const { arbitrationCost } = d

  arbitratorView.options.address = d.arbitrator

  return {
    blockNumber: T2CR_BLOCK,
    fileURI,
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
 * Submits evidence for a dispute
 * @param {{ type: string, payload: ?object, meta: ?object }} action - The action object.
 * @returns {object} - The `lessdux` collection mod object for updating the list of tokens.
 */
function* submitTokenEvidence({
  payload: { evidenceData, file, ID, evidenceSide },
}) {
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
    fileTypeExtension,
    evidenceSide,
  }

  const { arbitrableTokenList } = yield call(instantiateEnvObjects)

  const enc = new TextEncoder()
  const ipfsHashEvidenceObj = yield call(
    ipfsPublish,
    'evidence.json',
    enc.encode(JSON.stringify(evidenceJSON))
  )

  const ipfsHashEvidence =
    ipfsHashEvidenceObj[1].hash + ipfsHashEvidenceObj[0].path

  yield call(
    arbitrableTokenList.methods.submitEvidence(ID, `/ipfs/${ipfsHashEvidence}`)
      .send,
    {
      from: yield select(walletSelectors.getAccount),
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
      collection: arbitrableTokenListActions.tokenEvidence.self,
    },
    arbitrableTokenListActions.tokenEvidence,
    submitTokenEvidence
  )
}
