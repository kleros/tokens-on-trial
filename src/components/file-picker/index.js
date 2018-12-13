import React from 'react'
import PropTypes from 'prop-types'
import Dropzone from 'react-dropzone'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'

import Button from '../button'

import './file-picker.css'

const FilePicker = ({ message, buttonMessage, filePreviewURL, ...rest }) => (
  <Dropzone className="FilePicker" {...rest}>
    <FontAwesomeIcon icon="upload" className="FilePicker-icon" />
    <small>{message}</small>
    <Button type="ternary" size="small">
      {buttonMessage}
    </Button>
    {filePreviewURL && <div>{filePreviewURL}</div>}
  </Dropzone>
)

FilePicker.propTypes = {
  // React Dropzone
  ...Dropzone.propTypes,

  // State
  message: PropTypes.node,
  buttonMessage: PropTypes.node,
  filePreviewURL: PropTypes.string
}

FilePicker.defaultProps = {
  // State
  message: 'Drag file here or',
  buttonMessage: 'Browse for files',
  filePreviewURL: null
}

export default FilePicker
