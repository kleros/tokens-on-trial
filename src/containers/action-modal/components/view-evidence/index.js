import React from 'react'
import PropTypes from 'prop-types'

import { IPFS_URL } from '../../../../bootstrap/dapp-api'
import Button from '../../../../components/button'
import './view-evidence.css'

const downloadClick = url => async () => {
  window.open(`${IPFS_URL}${url}`)
}

const ViewEvidence = ({ closeActionModal, evidence }) => (
  <div className="ViewEvidence">
    <h3 className="Modal-title">Evidence</h3>
    <hr />
    <div className="ViewEvidence-information">
      <h4 style={{ margin: 0 }}>Title:</h4>
      <p>{evidence.title ? evidence.title : evidence.name}</p>{' '}
      {/* Read from name if title is unavailable for backwards compatibility */}
      <br />
      <h4 style={{ margin: 0 }}>Description:</h4>
      <p>{evidence.description}</p>
    </div>
    <br />
    <div
      className="ViewEvidence-actions"
      style={{ justifyContent: !evidence.fileURI ? 'center' : 'space-between' }}
    >
      <Button
        className="View-return"
        onClick={closeActionModal}
        type="secondary"
      >
        Return
      </Button>
      {evidence.fileURI && (
        <Button
          className="View-request"
          onClick={downloadClick(evidence.fileURI)}
          type="primary"
        >
          Download Evidence
        </Button>
      )}
    </div>
  </div>
)

ViewEvidence.propTypes = {
  evidence: PropTypes.shape({
    name: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    fileURI: PropTypes.string.isRequired
  }).isRequired,
  closeActionModal: PropTypes.func.isRequired
}

export default ViewEvidence
