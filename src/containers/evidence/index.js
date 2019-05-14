import React, { Component } from 'react'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import PropTypes from 'prop-types'
import { BeatLoader } from 'react-spinners'
import Archon from '@kleros/archon'
import * as mime from 'mime-types'

import * as tcrConstants from '../../constants/tcr'
import { onlyInfura, IPFS_URL } from '../../bootstrap/dapp-api'
import { itemShape, tcrShape } from '../../reducers/generic-shapes'
import { getFileIcon } from '../../utils/evidence'
import { ContractsContext } from '../../bootstrap/contexts'
import { rulingMessage } from '../../utils/ui'
import Button from '../../components/button'
import * as arbitrableTokenListSelectors from '../../reducers/arbitrable-token-list'
import * as arbitrableAddressListSelectors from '../../reducers/arbitrable-address-list'

import './evidence.css'

const getEvidenceInfo = async ({ returnValues, archon, txHash }) => {
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
    ]).isRequired
  }

  state = { requestsInfo: null }

  async componentWillReceiveProps({
    item: { requests, badgeContractAddr },
    tcrData,
    tcr
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

    const { evidenceEvents } = badgeContractAddr
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
                txHash
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
        txHash: e.transactionHash
      })
      const { requestsInfo } = this.state
      const newRequestInfo = { ...requestsInfo }

      if (!newRequestInfo[evidence._evidenceGroupID]) window.reload()

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
      item: {
        latestRequest: { resolved },
        badgeContractAddr
      },
      handleOpenEvidenceModal,
      handleViewEvidenceClick
    } = this.props
    const { requestsInfo } = this.state

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
          {!requestsInfo ? (
            <BeatLoader color="#3d464d" />
          ) : (
            <div className="Evidence-requests">
              {Object.keys(requestsInfo)
                .map(key => requestsInfo[key])
                .sort((a, b) => b.submissionTime - a.submissionTime)
                .map((requestInfo, i) => (
                  <div key={i}>
                    <h4 style={{ margin: 0 }}>
                      Request # {Object.keys(requestsInfo).length - i}
                    </h4>
                    {requestInfo.disputed && requestInfo.resolved && (
                      <h5
                        style={{
                          margin: 0,
                          marginBottom: '16px',
                          fontWeight: 400
                        }}
                      >
                        {rulingMessage(
                          requestInfo.ruling !==
                            tcrConstants.RULING_OPTIONS.None,
                          false,
                          false,
                          requestInfo.ruling.toString()
                        )}
                      </h5>
                    )}
                    <div className="Evidence-evidence--list">
                      {requestInfo.evidences.length === 0 && (
                        <small style={{ marginLeft: '5px', marginTop: '10px' }}>
                          <i>No evidence submitted.</i>
                        </small>
                      )}
                      {Object.keys(requestInfo.evidences)
                        .map(txHash => requestInfo.evidences[txHash])
                        .map((evidence, j) => (
                          <div
                            className="Evidence-evidence--item"
                            key={`${i}${j}`}
                            onClick={handleViewEvidenceClick(evidence.evidence)}
                          >
                            <FontAwesomeIcon icon={evidence.icon} size="2x" />
                          </div>
                        ))}
                    </div>
                    <hr
                      className="Evidence-separator"
                      style={{ marginBottom: '26px' }}
                    />
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    )
  }
}

EvidenceSection.propTypes = {
  item: itemShape,
  handleOpenEvidenceModal: PropTypes.func.isRequired,
  handleViewEvidenceClick: PropTypes.func.isRequired
}

EvidenceSection.defaultProps = {
  item: null
}

export default EvidenceSection
