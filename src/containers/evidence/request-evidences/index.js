import React from 'react'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import PropTypes from 'prop-types'

import * as tcrConstants from '../../../constants/tcr'
import { rulingMessage } from '../../../utils/ui'

import './request-evidences.css'

const RequestEvidences = ({
  requestInfo,
  requestNumber,
  handleViewEvidenceClick
}) => (
  <div key={requestNumber}>
    <h4 style={{ margin: 0 }}>Request # {requestNumber}</h4>
    {requestInfo.disputed && requestInfo.resolved && (
      <h5
        style={{
          margin: 0,
          marginBottom: '16px',
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
    )}
    <div className="RequestEvidence-evidence--list">
      {(!requestInfo.evidences || requestInfo.evidences.length === 0) && (
        <small style={{ marginLeft: '5px', marginTop: '10px' }}>
          <i>No evidence submitted.</i>
        </small>
      )}
      {Object.keys(requestInfo.evidences)
        .map(txHash => requestInfo.evidences[txHash])
        .map((evidence, j) => (
          <div
            className="RequestEvidence-evidence--item"
            key={`${requestNumber}${j}`}
            onClick={handleViewEvidenceClick(evidence.evidence)}
          >
            <FontAwesomeIcon icon={evidence.icon} size="2x" />
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
        evidence: PropTypes.shape({}).isRequired,
        icon: PropTypes.string.isRequired
      })
    )
  }).isRequired,
  handleViewEvidenceClick: PropTypes.func.isRequired,
  requestNumber: PropTypes.number.isRequired
}

export default RequestEvidences
