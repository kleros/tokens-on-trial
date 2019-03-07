import React from 'react'
import PropTypes from 'prop-types'
import Dropzone from 'react-dropzone'

import './file-picker.css'

const FilePicker = ({ message, file, imageFilePreviewURL, ...rest }) => (
  <Dropzone className="FilePicker" {...rest}>
    {!file ? (
      <div className="FilePicker-uploadInfo">
        <small>{message}</small>
      </div>
    ) : (
      <>
        {imageFilePreviewURL && (
          <div
            className="FilePicker-filePreview"
            style={{ backgroundImage: `url(${imageFilePreviewURL})` }}
          />
        )}
      </>
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
