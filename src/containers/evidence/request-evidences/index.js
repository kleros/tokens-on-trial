import React from 'react'
import PropTypes from 'prop-types'

import * as tcrConstants from '../../../constants/tcr'
import { rulingMessage } from '../../../utils/ui'

import EvidenceCard from './evidence-card'

import './request-evidences.css'

const RequestEvidences = ({
  requestInfo,
  requestNumber,
  requester,
  challenger,
  idKey
}) => (
  <div
    key={idKey}
    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
  >
    <h4 className="RequestEvidence-title">Request #{requestNumber}</h4>
    {requestInfo.disputed && requestInfo.resolved && (
      <>
        <div style={{ height: '20px', borderLeft: '1px solid #ccc' }} />
        <h5
          style={{
            margin: '16px 0',
            fontWeight: 400
          }}
        >
          {rulingMessage(
            requestInfo.ruling !== tcrConstants.RULING_OPTIONS.None,
            false,
            false,
            requestInfo.ruling.toString()
          )}
        </h5>
      </>
    )}
    <div className="RequestEvidence-evidence--list">
      {(!requestInfo.evidences ||
        Object.keys(requestInfo.evidences).length === 0) && (
        <>
          <div style={{ height: '20px', borderLeft: '1px solid #ccc' }} />
          <small style={{ marginLeft: '5px', marginTop: '16px' }}>
            <i>No evidence submitted.</i>
          </small>
        </>
      )}
      {Object.keys(requestInfo.evidences)
        .map(txHash => requestInfo.evidences[txHash])
        .sort((a, b) => b.blockNumber - a.blockNumber)
        .map((evidence, j) => (
          <div
            key={`${idKey}${j}`}
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            <div style={{ height: '20px', borderLeft: '1px solid #ccc' }} />
            <EvidenceCard
              key={`${requestNumber}${j}`}
              requester={requester}
              challenger={challenger}
              evidence={evidence}
              requestNumber={requestNumber}
              idKey={`${requestNumber}${j}`}
            />
          </div>
        ))}
    </div>
    <hr
      className="RequestEvidence-separator"
      style={{ marginBottom: '26px' }}
    />
  </div>
)

RequestEvidences.propTypes = {
  requestInfo: PropTypes.shape({
    disputed: PropTypes.bool.isRequired,
    resolved: PropTypes.bool.isRequired,
    ruling: PropTypes.number.isRequired,
    evidences: PropTypes.arrayOf(
      PropTypes.shape({
        evidence: PropTypes.shape({
          evidence: PropTypes.shape({
            description: PropTypes.string.isRequired,
            fileTypeExtension: PropTypes.string.isRequired,
            fileURI: PropTypes.string.isRequired,
            title: PropTypes.string.isRequired,
            position: PropTypes.number
          })
        }).isRequired,
        icon: PropTypes.string.isRequired
      })
    )
  }).isRequired,
  requestNumber: PropTypes.number.isRequired,
  requester: PropTypes.string.isRequired,
  challenger: PropTypes.string.isRequired,
  idKey: PropTypes.string.isRequired
}

export default RequestEvidences
