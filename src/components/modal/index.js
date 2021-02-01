import React from 'react'
import ReactModal from 'react-modal'
import PropTypes from 'prop-types'
import './modal.css'

ReactModal.setAppElement('#root')
const Modal = ({ onRequestClose, children, className, ...rest }) => (
  <ReactModal
    className={`Modal ${className}`}
    onRequestClose={onRequestClose}
    overlayClassName="Modal--overlay"
    {...rest}
  >
    {children}
  </ReactModal>
)

Modal.propTypes = {
  // React Modal
  ...ReactModal.propTypes,
  onRequestClose: PropTypes.func,

  // State
  children: PropTypes.node,

  // Modifiers
  className: PropTypes.string,
}

Modal.defaultProps = {
  // React Modal
  onRequestClose: null,

  // State
  children: null,

  // Modifiers
  className: '',
}

export default Modal
