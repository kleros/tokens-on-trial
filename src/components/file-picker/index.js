import React from 'react'
import PropTypes from 'prop-types'
import Dropzone from 'react-dropzone'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'

import Button from '../button'
import { getFileIcon } from '../../utils/evidence'

import './file-picker.css'

const FilePicker = ({ message, buttonMessage, file, ...rest }) => (
  <Dropzone className="FilePicker" {...rest}>
    {!file ? (
      <div className="FilePicker-uploadInfo">
        <FontAwesomeIcon icon="upload" className="FilePicker-icon" />
        <small>{message}</small>
        <Button type="ternary" size="small">
          {buttonMessage}
        </Button>
      </div>
    ) : (
      <div>
        <FontAwesomeIcon
          icon={getFileIcon(file.type)}
          className="FilePicker-icon"
        />{' '}
        {file.name}
      </div>
    )}
  </Dropzone>
)

FilePicker.propTypes = {
  // React Dropzone
  ...Dropzone.propTypes,

  // State
  message: PropTypes.node,
  buttonMessage: PropTypes.node
}

FilePicker.defaultProps = {
  // State
  message: 'Drag file here or',
  buttonMessage: 'Browse for files'
}

export default FilePicker
