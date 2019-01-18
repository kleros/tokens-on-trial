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
        <FontAwesomeIcon className="FilePicker-icon" icon="upload" />
        <small>{message}</small>
        <Button size="small" type="ternary">
          {buttonMessage}
        </Button>
      </div>
    ) : (
      <div>
        <FontAwesomeIcon
          className="FilePicker-icon"
          icon={getFileIcon(file.type)}
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
