import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import * as modalActions from '../../actions/modal'
import * as modalSelectors from '../../reducers/modal'
import * as modalConstants from '../../constants/modal'
import * as tokenActions from '../../actions/token'
import * as arbitrableTokenListActions from '../../actions/arbitrable-token-list'
import * as arbitrableTokenListSelectors from '../../reducers/arbitrable-token-list'
import Modal from '../../components/modal'

import Submit from './components/submit'
import Clear from './components/clear'
import {
  getTokenFormIsInvalid,
  submitTokenForm
} from './components/submit/token-form'

import './token-modal.css'

class TokenModal extends PureComponent {
  static propTypes = {
    tokenFormIsInvalid: PropTypes.bool.isRequired,
    openTokenModal: modalSelectors.openTokenModalShape,
    arbitrableTokenListData:
      arbitrableTokenListSelectors.arbitrableTokenListDataShape.isRequired,

    closeTokenModal: PropTypes.func.isRequired,
    fetchArbitrableTokenListData: PropTypes.func.isRequired,
    submitTokenForm: PropTypes.func.isRequired,
    createToken: PropTypes.func.isRequired
  }

  static defaultProps = {
    openTokenModal: null
  }

  handleSubmitTokenClick = token => {
    const { createToken } = this.props
    createToken({ tokenData: token, metaEvidence: 'meta evidence' })
  }

  handleClearTokenClick = () => {
    console.info(`clear token`)
  }

  componentDidMount() {
    const { fetchArbitrableTokenListData } = this.props
    fetchArbitrableTokenListData()
  }

  render() {
    const {
      openTokenModal,
      closeTokenModal,
      arbitrableTokenListData,
      submitTokenForm,
      tokenFormIsInvalid
    } = this.props
    return (
      <Modal
        isOpen={openTokenModal !== null}
        onRequestClose={closeTokenModal}
        className="TokenModal"
      >
        {openTokenModal === modalConstants.TOKEN_MODAL_ENUM.Submit ? (
          <Submit
            arbitrableTokenListData={arbitrableTokenListData}
            closeTokenModal={closeTokenModal}
            submitTokenForm={submitTokenForm}
            submitToken={this.handleSubmitTokenClick}
            tokenFormIsInvalid={tokenFormIsInvalid}
          />
        ) : (
          <Clear
            arbitrableTokenListData={arbitrableTokenListData}
            closeTokenModal={closeTokenModal}
            clearToken={this.handleClearTokenClick}
          />
        )}
      </Modal>
    )
  }
}

export default connect(
  state => ({
    openTokenModal: state.modal.openTokenModal,
    tokenFormIsInvalid: getTokenFormIsInvalid(state),
    arbitrableTokenListData: state.arbitrableTokenList.arbitrableTokenListData
  }),
  {
    closeTokenModal: modalActions.closeTokenModal,
    createToken: tokenActions.createToken,
    submitTokenForm,
    fetchArbitrableTokenListData:
      arbitrableTokenListActions.fetchArbitrableTokenListData
  }
)(TokenModal)
