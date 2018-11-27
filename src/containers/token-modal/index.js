import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import * as modalActions from '../../actions/modal'
import * as modalSelectors from '../../reducers/modal'
import * as modalConstants from '../../constants/modal'
import * as tokenConstants from '../../constants/token'
import * as tokenActions from '../../actions/token'
import * as tokenSelectors from '../../reducers/token'
import * as arbitrableTokenListActions from '../../actions/arbitrable-token-list'
import * as arbitrableTokenListSelectors from '../../reducers/arbitrable-token-list'
import { web3 } from '../../bootstrap/dapp-api'
import Modal from '../../components/modal'

import FundDispute from './components/fund-dispute'
import Submit from './components/submit'
import Resubmit from './components/resubmit'
import Clear from './components/clear'
import Challenge from './components/challenge'
import {
  getTokenFormIsInvalid,
  submitTokenForm
} from './components/submit/token-form'

import './token-modal.css'

class TokenModal extends PureComponent {
  static propTypes = {
    token: tokenSelectors.tokenShape,
    tokenFormIsInvalid: PropTypes.bool.isRequired,
    openTokenModal: modalSelectors.openTokenModalShape,
    arbitrableTokenListData:
      arbitrableTokenListSelectors.arbitrableTokenListDataShape.isRequired,

    closeTokenModal: PropTypes.func.isRequired,
    fetchArbitrableTokenListData: PropTypes.func.isRequired,
    submitTokenForm: PropTypes.func.isRequired,
    createToken: PropTypes.func.isRequired,
    clearToken: PropTypes.func.isRequired,
    fundDispute: PropTypes.func.isRequired,
    requestRegistration: PropTypes.func.isRequired
  }

  static defaultProps = {
    openTokenModal: null,
    token: null
  }

  handleSubmitTokenClick = token => {
    const { createToken } = this.props
    createToken({ tokenData: token })
  }

  handleResubmitTokenClick = () => {
    const { requestRegistration, token } = this.props
    requestRegistration({ ID: token.data.ID })
  }

  handleClearTokenClick = () => {
    const { clearToken, token } = this.props
    clearToken({ ID: token.data.ID })
  }

  handleChallengeClick = () => {
    const { fundDispute, token, arbitrableTokenListData } = this.props
    const value = web3.utils
      .toBN(arbitrableTokenListData.data.challengeReward)
      .add(web3.utils.toBN(arbitrableTokenListData.data.stake))
      .add(web3.utils.toBN(arbitrableTokenListData.data.arbitrationCost / 2))
    fundDispute({
      ID: token.data.ID,
      value,
      side: tokenConstants.SIDE.Challenger
    })
  }

  handleFundDisputeClick = () => {
    const { fundDispute, token, arbitrableTokenListData } = this.props
    const value = web3.utils
      .toBN(arbitrableTokenListData.data.stake)
      .add(web3.utils.toBN(arbitrableTokenListData.data.arbitrationCost / 2))
    fundDispute({
      ID: token.data.ID,
      value,
      side: tokenConstants.SIDE.Requester
    })
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
      tokenFormIsInvalid,
      token
    } = this.props
    return (
      <Modal
        isOpen={openTokenModal !== null}
        onRequestClose={closeTokenModal}
        className="TokenModal"
      >
        {(() => {
          switch (openTokenModal) {
            case modalConstants.TOKEN_MODAL_ENUM.Submit:
              return (
                <Submit
                  arbitrableTokenListData={arbitrableTokenListData}
                  closeTokenModal={closeTokenModal}
                  submitTokenForm={submitTokenForm}
                  submitToken={this.handleSubmitTokenClick}
                  tokenFormIsInvalid={tokenFormIsInvalid}
                />
              )
            case modalConstants.TOKEN_MODAL_ENUM.Clear:
              return (
                <Clear
                  tokenName={
                    token && token.data ? token.data.tokenName : 'token'
                  }
                  arbitrableTokenListData={arbitrableTokenListData}
                  closeTokenModal={closeTokenModal}
                  clearToken={this.handleClearTokenClick}
                />
              )
            case modalConstants.TOKEN_MODAL_ENUM.Challenge:
              return (
                <Challenge
                  tokenName={
                    token && token.data ? token.data.tokenName : 'token'
                  }
                  arbitrableTokenListData={arbitrableTokenListData}
                  closeTokenModal={closeTokenModal}
                  fundDispute={this.handleChallengeClick}
                />
              )
            case modalConstants.TOKEN_MODAL_ENUM.Resubmit:
              return (
                <Resubmit
                  tokenName={
                    token && token.data ? token.data.tokenName : 'token'
                  }
                  arbitrableTokenListData={arbitrableTokenListData}
                  closeTokenModal={closeTokenModal}
                  resubmitToken={this.handleResubmitTokenClick}
                />
              )
            case modalConstants.TOKEN_MODAL_ENUM.FundDispute:
              return (
                <FundDispute
                  tokenName={
                    token && token.data ? token.data.tokenName : 'token'
                  }
                  arbitrableTokenListData={arbitrableTokenListData}
                  closeTokenModal={closeTokenModal}
                  fundDispute={this.handleFundDisputeClick}
                />
              )
            case undefined:
            case null:
              break
            default:
              throw new Error('Unhandled modal request')
          }
        })()}
      </Modal>
    )
  }
}

export default connect(
  state => ({
    openTokenModal: state.modal.openTokenModal,
    tokenFormIsInvalid: getTokenFormIsInvalid(state),
    arbitrableTokenListData: state.arbitrableTokenList.arbitrableTokenListData,
    token: state.token.token
  }),
  {
    closeTokenModal: modalActions.closeTokenModal,
    createToken: tokenActions.createToken,
    requestRegistration: tokenActions.requestRegistration,
    clearToken: tokenActions.clearToken,
    fundDispute: tokenActions.fundDispute,
    submitTokenForm,
    fetchArbitrableTokenListData:
      arbitrableTokenListActions.fetchArbitrableTokenListData
  }
)(TokenModal)
