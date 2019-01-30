import React from 'react'
import PropTypes from 'prop-types'

import Button from '../../../../components/button'
import './view-evidence.css'

const downloadClick = url => async () => {
  window.open(`https://ipfs.kleros.io${url}`)
}

const ViewEvidence = ({ closeActionModal, evidence }) => (
  <div className="ViewEvidence">
    <h3 className="Modal-title">Evidence</h3>
    <hr />
    <p>Name: {evidence.name}</p>
    <p>Description: {evidence.description}</p>
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
