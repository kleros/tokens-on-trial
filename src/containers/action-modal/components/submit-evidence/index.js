import React from 'react'
import PropTypes from 'prop-types'

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
    <h3 className="Modal-title">Submit Evidence</h3>
    <br />
    <EvidenceForm className="SubmitEvidence-form" onSubmit={submitEvidence} />
    <FilePicker
      multiple={false}
      onDropAccepted={handleOnFileDropAccepted}
      file={file}
      message={
        <span>
          (Max Size: 5MB)
          <br />
          Drag file here or
        </span>
      }
    />
    {fileInfoMessage && <div>{fileInfoMessage}</div>}
    <br />
    <div className="SubmitEvidence-actions">
      <Button
        className="Submit-return"
        type="secondary"
        onClick={closeActionModal}
      >
        Return
      </Button>
      <Button
        className="Submit-request"
        type="primary"
        onClick={submitEvidenceForm}
        disabled={evidenceFormIsInvalid}
      >
        Submit evidence now
      </Button>
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
