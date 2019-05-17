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
import * as arbitrableTokenListSelectors from '../../reducers/arbitrable-token-list'
import * as arbitrableAddressListSelectors from '../../reducers/arbitrable-address-list'

import RequestEvidences from './request-evidences'

import './evidence.css'

const getEvidenceInfo = async ({
  returnValues,
  archon,
  txHash,
  blockNumber
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
      hash: calculatedMultihash
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
    _party
  }
}

class EvidenceSection extends Component {
  static contextType = ContractsContext

  static propTypes = {
    tcrData: tcrShape.isRequired,
    tcr: PropTypes.oneOfType([
      arbitrableTokenListSelectors.arbitrableTokenListDataShape,
      arbitrableAddressListSelectors.arbitrableAddressListDataShape
    ]).isRequired,
    itemID: PropTypes.string.isRequired
  }

  state = { requestsInfo: null }

  async componentWillReceiveProps({
    item: { requests, badgeContractAddr },
    tcrData,
    tcr,
    itemID
  }) {
    let { requestsInfo } = this.state
    if (requestsInfo) return
    if (!tcrData || (badgeContractAddr && !tcrData[badgeContractAddr])) return
    if (
      (badgeContractAddr && !tcrData[badgeContractAddr].evidenceEvents) ||
      (!badgeContractAddr && !tcrData.evidenceEvents)
    )
      return
    if (!this.context) return

    const { evidenceEvents, requestSubmittedEvents } = badgeContractAddr
      ? tcrData[badgeContractAddr]
      : tcrData
    requestsInfo = {}
    requests.forEach(request => {
      requestsInfo[request.evidenceGroupID] = {
        evidences: evidenceEvents[request.evidenceGroupID]
          ? evidenceEvents[request.evidenceGroupID].reduce((acc, curr) => {
              acc[curr.transactionHash] = curr
              return acc
            }, {})
          : {},
        ruling: request.ruling,
        resolved: request.resolved,
        submissionTime: request.submissionTime,
        disputed: request.disputed
      }
    })

    requestSubmittedEvents[itemID].forEach((event, i) => {
      const evidenceGroupID = web3Utils
        .toBN(web3Utils.soliditySha3(itemID, i))
        .toString(10)
      requestsInfo[evidenceGroupID].requestSubmittedEvent = event
    })

    const { archon } = this.context

    await Promise.all(
      Object.keys(requestsInfo).map(async evidenceGroupID => {
        requestsInfo[evidenceGroupID].evidences = (await Promise.all(
          Object.keys(requestsInfo[evidenceGroupID].evidences).map(
            async txHash =>
              getEvidenceInfo({
                returnValues:
                  requestsInfo[evidenceGroupID].evidences[txHash].returnValues,
                archon,
                txHash,
                blockNumber:
                  requestsInfo[evidenceGroupID].evidences[txHash].blockNumber
              })
          )
        )).reduce((acc, curr) => {
          acc[curr.txHash] = curr
          return acc
        }, {})
        return requestsInfo[evidenceGroupID]
      })
    )

    // Listen for new evidence.
    const eventSubscription = tcr.events.Evidence(async (err, e) => {
      if (err) {
        console.error(err)
        return
      }

      const evidence = await getEvidenceInfo({
        returnValues: e.returnValues,
        archon,
        txHash: e.transactionHash,
        blockNumber: e.blockNumber
      })
      const { requestsInfo } = this.state
      const newRequestInfo = { ...requestsInfo }

      if (!newRequestInfo[evidence._evidenceGroupID]) window.location.reload()

      newRequestInfo[evidence._evidenceGroupID].evidences[
        e.transactionHash
      ] = evidence
      this.setState({ requestsInfo: newRequestInfo })
    })

    this.setState({ requestsInfo, eventSubscription })
  }

  componentWillUnmount() {
    const { eventSubscription } = this.state
    if (!eventSubscription) return

    eventSubscription.unsubscribe()
  }

  render() {
    const {
      item: { badgeContractAddr, latestRequest },
      handleOpenEvidenceModal,
      itemID
    } = this.props
    const { requestsInfo } = this.state
    const requester = latestRequest.parties[1]
    const challenger = latestRequest.parties[2]

    if (!requestsInfo)
      return (
        <div className="Evidence">
          <hr className="Evidence-separator" />
          <div className="Evidence-header">
            <h3>Evidence</h3>
          </div>
          <div className="Evidence-evidence">
            <BeatLoader color="#3d464d" />
          </div>
        </div>
      )

    const history = Object.keys(requestsInfo)
      .map(key => requestsInfo[key])
      .sort((a, b) => b.submissionTime - a.submissionTime)

    const latestRequestEvent = history[0]
    const { resolved } = latestRequestEvent

    return (
      <div className="Evidence">
        <hr className="Evidence-separator" />
        <div className="Evidence-header">
          {/* eslint-disable react/jsx-no-bind */}
          <h3>Evidence</h3>
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
              requester={requester}
              challenger={challenger}
              requestInfo={latestRequestEvent}
              requestNumber={history.length > 1 ? history.length : 1}
              itemID={itemID}
            />
            {history
              .filter((_, i) => i > 0)
              .map((requestInfo, i) => (
                <RequestEvidences
                  idKey={i}
                  itemID={itemID}
                  requester={requester}
                  challenger={challenger}
                  requestInfo={requestInfo}
                  requestNumber={history.length - i - 1}
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
  handleOpenEvidenceModal: PropTypes.func.isRequired
}

EvidenceSection.defaultProps = {
  item: null
}

export default EvidenceSection
