import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import * as modalActions from '../../actions/modal'
import * as modalSelectors from '../../reducers/modal'
import * as tokenActions from '../../actions/token'
import * as arbitrableTokenListActions from '../../actions/arbitrable-token-list'
import * as arbitrableTokenListSelectors from '../../reducers/arbitrable-token-list'
import Modal from '../../components/modal'

import Submit from './components/submit'
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
    submitTokenForm: PropTypes.func.isRequired
  }

  static defaultProps = {
    openTokenModal: null
  }

  handleSubmitTokenClick = token => {
    console.info('clicked', token)
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
        <Submit
          arbitrableTokenListData={arbitrableTokenListData}
          closeTokenModal={closeTokenModal}
          submitTokenForm={submitTokenForm}
          submitToken={this.handleSubmitTokenClick}
          tokenFormIsInvalid={tokenFormIsInvalid}
        />
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
    submitToken: tokenActions.createToken,
    submitTokenForm,
    fetchArbitrableTokenListData:
      arbitrableTokenListActions.fetchArbitrableTokenListData
  }
)(TokenModal)
