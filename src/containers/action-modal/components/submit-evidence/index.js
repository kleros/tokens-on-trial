import React from 'react'
import PropTypes from 'prop-types'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'

import FilePicker from '../../../../components/file-picker'
import Button from '../../../../components/button'
import { EvidenceForm } from '../../components/submit-evidence/evidence-form'

import './submit-evidence.css'

const SubmitEvidence = ({
  closeActionModal,
  submitEvidence,
  fileInfoMessage,
  handleOnFileDropAccepted,
  evidenceFormIsInvalid,
  submitEvidenceForm,
  file
}) => (
  <div className="SubmitEvidence">
    <div className="SubmitEvidence-header">
      <FontAwesomeIcon
        className="SubmitEvidence-header-icon"
        icon="folder-open"
      />
      <span className="SubmitEvidence-header-title">Submit Evidence</span>
    </div>
    <div style={{ padding: '20px' }}>
      <EvidenceForm className="SubmitEvidence-form" onSubmit={submitEvidence} />
      <FilePicker
        file={file}
        message={
          <span>
            (Max Size: 1MB)
            <br />
            Drag file or click here
          </span>
        }
        multiple={false}
        onDropAccepted={handleOnFileDropAccepted}
      />
      {fileInfoMessage && <div>{fileInfoMessage}</div>}
      <br />
      <div className="SubmitEvidence-actions">
        <Button
          className="Submit-return"
          onClick={closeActionModal}
          type="secondary"
        >
          Return
        </Button>
        <Button
          className="Submit-request"
          disabled={evidenceFormIsInvalid}
          onClick={submitEvidenceForm}
          type="primary"
        >
          Submit evidence now
        </Button>
      </div>
    </div>
  </div>
)

SubmitEvidence.propTypes = {
  // Action Dispatchers
  closeActionModal: PropTypes.func.isRequired,
  submitEvidence: PropTypes.func.isRequired,
  handleOnFileDropAccepted: PropTypes.func.isRequired,

  // Evidence Form
  evidenceFormIsInvalid: PropTypes.bool.isRequired,
  submitEvidenceForm: PropTypes.func.isRequired,
  fileInfoMessage: PropTypes.string,
  file: PropTypes.shape({
    name: PropTypes.string.isRequired,
    size: PropTypes.number.isRequired,
    type: PropTypes.string.isRequired
  })
}

SubmitEvidence.defaultProps = {
  fileInfoMessage: '',
  file: null
}

export default SubmitEvidence
