import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { BeatLoader } from 'react-spinners'
import Archon from '@kleros/archon'
import * as mime from 'mime-types'
import { onlyInfura, IPFS_URL, web3Utils } from '../../bootstrap/dapp-api'
import { itemShape, tcrShape } from '../../reducers/generic-shapes'
import { getFileIcon } from '../../utils/evidence'
import { ContractsContext } from '../../bootstrap/contexts'
import Button from '../../components/button'
import RequestEvidences from './request-evidences'
import './evidence.css'
import { instantiateEnvObjects } from '../../utils/tcr'

const getEvidenceInfo = async ({
  returnValues,
  archon,
  txHash,
  blockNumber,
}) => {
  const { _evidence, _evidenceGroupID, _arbitrator, _party } = returnValues
  const evidence = await (await fetch(`${IPFS_URL}${_evidence}`)).json()

  /* eslint-disable unicorn/number-literal-case */
  const calculatedMultihash = archon.utils.multihashFile(
    evidence,
    0x1b // keccak-256
  )

  if (
    !(await Archon.utils.validateFileFromURI(`${IPFS_URL}${_evidence}`, {
      hash: calculatedMultihash,
    }))
  ) {
    console.warn('Invalid evidence', evidence)
    return
  }

  const mimeType = mime.lookup(evidence.fileTypeExtension)
  return {
    txHash,
    blockNumber,
    evidence,
    icon: getFileIcon(mimeType),
    _arbitrator,
    _evidenceGroupID,
    _party,
  }
}

class EvidenceSection extends Component {
  static contextType = ContractsContext

  static propTypes = {
    tcrData: tcrShape.isRequired,
    itemID: PropTypes.string.isRequired,
  }

  state = { requestsInfo: null }

  async componentWillReceiveProps({
    item: { requests, badgeContractAddr },
    tcrData,
    itemID,
  }) {
    let { requestsInfo } = this.state
    if (!tcrData || (badgeContractAddr && !tcrData[badgeContractAddr])) return

    const isTokenEvidence = !badgeContractAddr
    if (badgeContractAddr && !tcrData[badgeContractAddr].evidenceEvents) return

    if (!this.context) return

    requestsInfo = {}
    const { T2CR_SUBGRAPH_URL, badgeContracts } = await instantiateEnvObjects()

    if (isTokenEvidence) {
      const data = await (
        await fetch(T2CR_SUBGRAPH_URL, {
          method: 'POST',
          body: JSON.stringify({
            query: `
            {
              token(id: "${itemID}") {
                requests {
                  id
                  result
                  resolutionTime
                  submissionTime
                  disputed
                  disputeID
                  arbitrator
                  blockNumber
                  evidences {
                    id
                    hash
                    submissionTime
                    submitter
                    evidenceURI
                    blockNumber
                  }
                }
              }
            }
          `,
          }),
        })
      ).json()

      const token = data.data.token
      token.requests = token.requests
        .map((request) => ({
          ...request,
          requestIndex: Number(request.id.slice(request.id.indexOf('-') + 1)),
          ruling: request.result === 'Accepted' ? 1 : 2,
          registrationRequest: request.type === 'RegistrationRequested',
        }))
        .map((request) => ({
          ...request,
          evidenceGroupID: web3Utils
            .toBN(web3Utils.soliditySha3(itemID, request.requestIndex))
            .toString(10),
          evidences: request.evidences
            .map((evidence) => ({
              ...evidence,
              evidenceGroupID: web3Utils
                .toBN(web3Utils.soliditySha3(itemID, request.requestIndex))
                .toString(10),
            }))
            .map((evidence) => ({
              ...evidence,
              blockNumber: Number(evidence.blockNumber),
              returnValues: {
                _evidence: evidence.evidenceURI,
                _evidenceGroupID: evidence.evidenceGroupID,
                _arbitrator: request.arbitrator,
                _party: evidence.submitter,
                _registrationRequest: request.type === 'RegistrationRequested',
              },
            })),
        }))

      token.requests.forEach((request) => {
        requestsInfo[request.evidenceGroupID] = {
          evidences: request.evidences.reduce((acc, curr) => {
            acc[curr.hash] = curr
            return acc
          }, {}),
          ruling: request.ruling,
          resolved: Number(request.resolutionTime) > 0,
          submissionTime: Number(request.submissionTime) * 1000,
          resolutionTime: Number(request.resolutionTime) * 1000,
          disputed: request.disputed,
          blockNumber: Number(request.blockNumber),
        }
      })
    } else {
      const badgeContract = badgeContracts[badgeContractAddr]
      const [requestSubmittedEvents] = await Promise.all([
        badgeContract.getPastEvents('RequestSubmitted', {
          filter: {
            _address: itemID,
          },
          fromBlock: 0,
          toBlock: 'latest',
        }),
      ])

      for (const [i, event] of requestSubmittedEvents.entries()) {
        const evidenceGroupID = web3Utils
          .toBN(web3Utils.soliditySha3(itemID, i))
          .toString(10)

        requestsInfo[evidenceGroupID] = requestsInfo[evidenceGroupID] || {}
        requestsInfo[evidenceGroupID].requestSubmittedEvent = event
      }
      for (const [i, request] of requests.entries()) {
        request.evidenceGroupID = web3Utils
          .toBN(web3Utils.soliditySha3(itemID, i))
          .toString(10)

        const [evidenceEvents] = await Promise.all([
          badgeContract.getPastEvents('Evidence', {
            filter: {
              _evidenceGroupID: request.evidenceGroupID,
            },
            fromBlock: 0,
            toBlock: 'latest',
          }),
        ])

        requestsInfo[request.evidenceGroupID] = {
          ...requestsInfo[request.evidenceGroupID],
          evidences: evidenceEvents
            ? evidenceEvents.reduce((acc, curr) => {
                acc[curr.transactionHash] = curr
                return acc
              }, {})
            : {},
          ruling: request.ruling,
          resolved: request.resolved,
          submissionTime: Number(request.submissionTime),
          resolutionTime: Number(request.resolutionTime),
          disputed: request.disputed,
        }
      }
    }

    const { archon } = this.context

    await Promise.all(
      Object.keys(requestsInfo).map(async (evidenceGroupID) => {
        requestsInfo[evidenceGroupID].evidences = (
          await Promise.all(
            Object.keys(requestsInfo[evidenceGroupID].evidences).map(
              async (txHash) =>
                getEvidenceInfo({
                  returnValues:
                    requestsInfo[evidenceGroupID].evidences[txHash]
                      .returnValues,
                  archon,
                  txHash,
                  blockNumber: Number(
                    requestsInfo[evidenceGroupID].evidences[txHash].blockNumber
                  ),
                })
            )
          )
        ).reduce((acc, curr) => {
          acc[curr.txHash] = curr
          return acc
        }, {})
        return requestsInfo[evidenceGroupID]
      })
    )

    this.setState({
      requestsInfo,
      tcrData: badgeContractAddr ? tcrData[badgeContractAddr] : tcrData,
    })
  }

  render() {
    const {
      item: { badgeContractAddr, latestRequest },
      handleOpenEvidenceModal,
      itemID,
      arbitratorView,
    } = this.props
    const { requestsInfo, tcrData } = this.state
    const requester = latestRequest.parties[1]
    const challenger = latestRequest.parties[2]

    if (!requestsInfo)
      return (
        <div className="Evidence">
          <hr className="Evidence-separator" />
          <div className="Evidence-header">
            <h3>Latest Request</h3>
          </div>
          <div className="Evidence-evidence">
            <BeatLoader color="#3d464d" />
          </div>
        </div>
      )

    const history = Object.keys(requestsInfo)
      .map((key) => requestsInfo[key])
      .sort((a, b) => b.submissionTime - a.submissionTime)

    const latestRequestInfo = history[0]

    if (!latestRequest) return null

    const { resolved } = latestRequestInfo
    const isTokenEvidence = !badgeContractAddr

    return (
      <div className="Evidence">
        <hr className="Evidence-separator" />
        <div className="Evidence-header">
          {/* eslint-disable react/jsx-no-bind */}
          <h3>Latest Request</h3>
          {!resolved && (
            <Button
              tooltip={onlyInfura ? 'Please install MetaMask.' : null}
              disabled={onlyInfura}
              onClick={() => handleOpenEvidenceModal(badgeContractAddr)}
              type="secondary"
            >
              Submit Evidence
            </Button>
          )}
        </div>
        <div className="Evidence-evidence">
          <div className="Evidence-requests">
            <RequestEvidences
              idKey="firstRequest"
              requester={requester}
              challenger={challenger}
              requestInfo={latestRequestInfo}
              requestNumber={history.length > 1 ? history.length : 1}
              itemID={itemID}
              tcrData={tcrData}
              arbitratorView={arbitratorView}
              isTokenEvidence={isTokenEvidence}
              evidences={latestRequestInfo.evidences}
            />
            <h3>Previous Requests</h3>
            {history
              .filter((_, i) => i > 0)
              .map((requestInfo, i) => (
                <RequestEvidences
                  idKey={`requestEvidences_${i}`}
                  key={`reqEvidences_${i}`}
                  itemID={itemID}
                  requester={requester}
                  challenger={challenger}
                  requestInfo={requestInfo}
                  requestNumber={history.length - i - 1}
                  tcrData={tcrData}
                  arbitratorView={arbitratorView}
                  isTokenEvidence={isTokenEvidence}
                  evidences={requestInfo.evidences}
                />
              ))}
          </div>
        </div>
      </div>
    )
  }
}

EvidenceSection.propTypes = {
  item: itemShape,
  handleOpenEvidenceModal: PropTypes.func.isRequired,
  arbitratorView: PropTypes.shape({
    methods: PropTypes.shape({
      getVoteCounter: PropTypes.func.isRequired,
    }),
  }).isRequired,
}

EvidenceSection.defaultProps = {
  item: null,
}

export default EvidenceSection
