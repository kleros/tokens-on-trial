import React from 'react'
import PropTypes from 'prop-types'
import Dropzone from 'react-dropzone'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'

import { getFileIcon } from '../../utils/evidence'
import './file-picker.css'

const FilePicker = ({ message, file, ...rest }) => (
  <Dropzone className="FilePicker" {...rest}>
    {!file ? (
      <div className="FilePicker-uploadInfo">
        <small>{message}</small>
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
  message: PropTypes.node
}

FilePicker.defaultProps = {
  // State
  message: 'Drag file or click here'
}

export default FilePicker
