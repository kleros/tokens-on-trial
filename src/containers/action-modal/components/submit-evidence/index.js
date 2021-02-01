import React, { useState } from 'react'
import PropTypes from 'prop-types'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import FilePicker from '../../../../components/file-picker'
import Button from '../../../../components/button'
import CheckboxInput from '../../../../components/checkbox-input'
import { EvidenceForm } from './evidence-form'
import './submit-evidence.css'

const SubmitEvidence = ({
  closeActionModal,
  submitEvidence,
  fileInfoMessage,
  handleOnFileDropAccepted,
  evidenceFormIsInvalid,
  submitEvidenceForm,
  file,
}) => {
  const [selectedOption, setSelectedOption] = useState(0)
  const [categoriesVisible, toggleCategories] = useState(0)

  const options = [
    {
      label: 'Discussion',
      value: 0,
      icon: 'comments',
      color: 'grey',
    },
    {
      label: 'Supporting Requester',
      value: 1,
      icon: 'thumbs-up',
      color: '#66e800',
    },
    {
      label: 'Against Requester',
      value: 2,
      icon: 'thumbs-down',
      color: '#f60c36',
    },
  ]
  /* eslint-disable react/jsx-no-bind */

  return (
    <div className="SubmitEvidence">
      <div className="SubmitEvidence-header">
        <FontAwesomeIcon
          className="SubmitEvidence-header-icon"
          icon="folder-open"
        />
        <span className="SubmitEvidence-header-title">Submit Evidence</span>
      </div>
      <div style={{ padding: '20px', paddingTop: '10px' }}>
        <EvidenceForm
          className="SubmitEvidence-form"
          onSubmit={(evidence) => submitEvidence(evidence, selectedOption)}
        />
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
        <CheckboxInput
          input={{
            value: categoriesVisible,
            onChange: () => toggleCategories(!categoriesVisible),
          }}
          label="Set Evidence Category"
          className="SubmitEvidence-checkboxExtra"
        />
        {!!categoriesVisible && (
          <div className="SubmitEvidence-options">
            {options.map((option) => (
              <div
                className="SubmitEvidence-options-item"
                key={option.value}
                onClick={() => setSelectedOption(option.value)}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div
                    className="SubmitEvidence-options-item-icon"
                    style={{ backgroundColor: option.color }}
                  >
                    <FontAwesomeIcon icon={option.icon} color="white" />
                  </div>
                  <span>{option.label}</span>
                </div>
                <label className="SubmitEvidence-options-item-radio">
                  <input
                    type="radio"
                    name="radio"
                    value={option.value}
                    checked={selectedOption === option.value}
                    className="SubmitEvidence-options-item-radio-input"
                  />
                  <span className="SubmitEvidence-options-item-radio-bg" />
                  <span
                    className={`${
                      selectedOption === option.value
                        ? 'SubmitEvidence-options-item-radio-marked'
                        : ''
                    }`}
                  />
                </label>
              </div>
            ))}
            <br />
          </div>
        )}
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
}

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
    type: PropTypes.string.isRequired,
  }),
}

SubmitEvidence.defaultProps = {
  fileInfoMessage: '',
  file: null,
}

export default SubmitEvidence
