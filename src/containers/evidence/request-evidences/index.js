import React, { useState } from 'react'
import PropTypes from 'prop-types'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'

import * as tcrConstants from '../../../constants/tcr'
import { rulingMessage } from '../../../utils/ui'

import EvidenceCard from './evidence-card'

import './request-evidences.css'

const getResultMessage = ({
  registrationRequest,
  disputed,
  ruling,
  isToken
}) => {
  let message
  console.info(registrationRequest, disputed, ruling, isToken)
  if (registrationRequest)
    if (disputed) {
      if (ruling === tcrConstants.RULING_OPTIONS.Accept)
        message = isToken ? 'Token Accepted' : 'Badge Added'
      else message = isToken ? 'Token Rejected' : 'Badge Denied'
    } else {
      message = isToken ? 'Token Accepted' : 'Badge Added'
    }
  else if (disputed)
    if (ruling === tcrConstants.RULING_OPTIONS.Accept) {
      message = isToken ? 'Token Removed' : 'Badge Removed'
    } else {
      message = isToken ? 'Token Kept' : 'Badge Kept'
    }
  else message = isToken ? 'Token Removed' : 'Badge Removed'

  return message
}

const RequestEvidences = ({
  requestInfo,
  requestNumber,
  requester,
  challenger,
  idKey,
  itemID
}) => {
  const [showHistory, toggleShowHistory] = useState(false)
  const {
    requestSubmittedEvent: {
      returnValues: { _registrationRequest }
    }
  } = requestInfo

  // Detect if request is related to a token or a badge.
  const isToken = itemID.length === 66

  /* eslint-disable react/jsx-no-bind */
  return (
    <div
      key={idKey}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
    >
      <h4 className="RequestEvidence-title">
        {_registrationRequest
          ? isToken
            ? 'Token Submission'
            : 'Badge Addition'
          : isToken
          ? 'Token Removal'
          : 'Badge Removal'}
      </h4>
      <div className="RequestEvidence-evidence--list">
        {(!requestInfo.evidences ||
          Object.keys(requestInfo.evidences).length === 0) && (
          <>
            <div style={{ height: '20px', borderLeft: '1px solid #ccc' }} />
            <small style={{ margin: '16px 0' }}>
              <i>No evidence submitted.</i>
            </small>
          </>
        )}
        {Object.keys(requestInfo.evidences)
          .map(txHash => requestInfo.evidences[txHash])
          .sort((a, b) => a.blockNumber - b.blockNumber)
          .filter((_, i) => showHistory || i <= 1)
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
        {Object.keys(requestInfo.evidences).length > 2 && (
          <>
            <div style={{ height: '20px', borderLeft: '1px solid #ccc' }} />
            <div
              onClick={() => toggleShowHistory(!showHistory)}
              className="RequestEvidence-toggle"
            >
              {showHistory ? 'Collapse' : 'Show All'}
              <FontAwesomeIcon
                icon={showHistory ? 'angle-up' : 'angle-down'}
                style={{ marginLeft: '10px' }}
              />
            </div>
          </>
        )}
        {requestInfo.disputed && requestInfo.resolved && (
          <>
            <div style={{ height: '20px', borderLeft: '1px solid #ccc' }} />
            <h5
              style={{
                margin: '16px 0',
                fontWeight: 400
              }}
            >
              <FontAwesomeIcon
                color="#4d00b4"
                icon="balance-scale"
                style={{ marginRight: '10px' }}
              />
              {rulingMessage(
                requestInfo.ruling !== tcrConstants.RULING_OPTIONS.None,
                false,
                false,
                requestInfo.ruling.toString()
              )}
            </h5>
          </>
        )}
        {requestInfo.resolved && (
          <>
            <div style={{ height: '20px', borderLeft: '1px solid #ccc' }} />
            <h4 className="RequestEvidence-title">
              {getResultMessage({
                ruling: requestInfo.ruling,
                disputed: requestInfo.disputed,
                registrationRequest: _registrationRequest,
                isToken
              })}
            </h4>
          </>
        )}
      </div>
      <hr
        className="RequestEvidence-separator"
        style={{ marginBottom: '26px' }}
      />
    </div>
  )
}

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
  idKey: PropTypes.string.isRequired,
  itemID: PropTypes.string.isRequired
}

export default RequestEvidences
