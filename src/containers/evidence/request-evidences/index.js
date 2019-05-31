import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import { connect } from 'react-redux'

import * as tcrConstants from '../../../constants/tcr'
import { rulingMessage } from '../../../utils/ui'
import * as arbitrableTokenListSelectors from '../../../reducers/arbitrable-token-list'
import * as arbitrableAddressListSelectors from '../../../reducers/arbitrable-address-list'

import EvidenceCard from './evidence-card'

import './request-evidences.css'

const getResultMessage = ({
  registrationRequest,
  disputed,
  ruling,
  isToken
}) => {
  let message
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
  itemID,
  tcrData,
  arbitratorData,
  arbitratorView
}) => {
  if (!requestInfo || !requestInfo.requestSubmittedEvent || !tcrData)
    return null

  const [showHistory, toggleShowHistory] = useState(false)
  const [timelineItems, setTimelineItems] = useState({})
  const {
    requestSubmittedEvent: {
      returnValues: { _registrationRequest }
    }
  } = requestInfo

  useEffect(() => {
    const fetchArbitratorData = async () => {
      if (Object.keys(requestInfo.evidences).length > 0) {
        const evidenceGroupID =
          requestInfo.evidences[Object.keys(requestInfo.evidences)[0]]
            ._evidenceGroupID

        // If a dispute is raised, fetch events.
        if (tcrData.disputeEvents[evidenceGroupID]) {
          const { _disputeID: disputeID } = tcrData.disputeEvents[
            evidenceGroupID
          ].returnValues
          requestInfo.evidences[
            tcrData.disputeEvents[evidenceGroupID].txHash
          ] = {
            ...tcrData.disputeEvents[evidenceGroupID],
            message: 'Dispute Created',
            arbitratorEvent: true
          }

          // Fetch rulings by the arbitrator.
          if (arbitratorData.appealDecisionEvents.events[disputeID]) {
            const winningChoices = await Promise.all(
              Object.keys(
                arbitratorData.appealDecisionEvents.events[disputeID]
              ).map(async (txHash, i) => ({
                blockNumber:
                  arbitratorData.appealDecisionEvents.events[disputeID][txHash]
                    .blockNumber,
                txHash,
                arbitratorEvent: true,
                message: (await arbitratorView.methods
                  .getVoteCounter(disputeID, i)
                  .call()).winningChoice
              }))
            )

            winningChoices
              .map(winningChoice => ({
                ...winningChoice,
                message: rulingMessage(
                  Number(winningChoice.message) !==
                    tcrConstants.RULING_OPTIONS.None,
                  false,
                  false,
                  winningChoice.message.toString()
                )
              }))
              .forEach(winningChoice => {
                requestInfo.evidences[winningChoice.txHash] = winningChoice
              })
          }
        }
      }
      setTimelineItems(requestInfo.evidences)
    }
    fetchArbitratorData()
  }, [])

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
        {Object.keys(timelineItems).length === 0 && (
          <>
            <div style={{ height: '20px', borderLeft: '1px solid #ccc' }} />
            <small style={{ margin: '16px 0' }}>
              <i>No evidence submitted.</i>
            </small>
          </>
        )}
        {Object.keys(timelineItems)
          .map(txHash => timelineItems[txHash])
          .sort((a, b) => a.blockNumber - b.blockNumber)
          .filter((_, i) => showHistory || i <= 2)
          .map((evidence, j) => (
            <React.Fragment key={`${idKey}${j}`}>
              {evidence.arbitratorEvent ? (
                <div
                  style={{
                    alignItems: 'center',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <div
                    style={{ height: '20px', borderLeft: '1px solid #ccc' }}
                  />
                  <h4 className="RequestEvidence-title">{evidence.message}</h4>
                </div>
              ) : (
                <div
                  style={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                  }}
                >
                  <div
                    style={{ height: '20px', borderLeft: '1px solid #ccc' }}
                  />
                  <EvidenceCard
                    key={`${requestNumber}${j}`}
                    requester={requester}
                    challenger={challenger}
                    evidence={evidence}
                    requestNumber={requestNumber}
                    idKey={`${requestNumber}${j}`}
                  />
                </div>
              )}
            </React.Fragment>
          ))}
        {Object.keys(timelineItems).length > 3 && (
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
  itemID: PropTypes.string.isRequired,
  tcrData: PropTypes.oneOfType([
    arbitrableTokenListSelectors.arbitrableTokenListDataShape,
    arbitrableAddressListSelectors.arbitrableAddressListDataShape
  ]).isRequired,
  arbitratorView: PropTypes.shape({
    methods: PropTypes.shape({
      getVoteCounter: PropTypes.func.isRequired
    })
  }).isRequired,
  arbitratorData: PropTypes.shape({
    appealDecisionEvents: PropTypes.shape({
      events: PropTypes.shape({}),
      blockNumber: PropTypes.number
    })
  }).isRequired
}

export default connect(state => ({
  arbitrableAddressListData:
    state.arbitrableAddressList.arbitrableAddressListData.data,
  arbitrableTokenListData:
    state.arbitrableTokenList.arbitrableTokenListData.data,
  arbitratorData: state.arbitrator.arbitratorData.data
}))(RequestEvidences)
