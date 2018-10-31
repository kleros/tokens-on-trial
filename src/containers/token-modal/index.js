import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import * as modalActions from '../../actions/modal'
import Modal from '../../components/modal'

import Submit from './components/submit'

import './token-modal.css'

const TokenModal = ({ openTokenModal, closeTokenModal }) => (
  <Modal
    isOpen={openTokenModal !== null}
    onRequestClose={closeTokenModal}
    className="TokenModal"
  >
    <Submit />
  </Modal>
)

TokenModal.propTypes = {
  closeTokenModal: PropTypes.func.isRequired,
  openTokenModal: PropTypes.bool.isRequired
}

export default connect(
  state => ({ openTokenModal: state.modal.openTokenModal }),
  { closeTokenModal: modalActions.closeTokenModal }
)(TokenModal)
