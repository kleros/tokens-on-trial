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
import * as walletSelectors from '../../reducers/wallet'
import { web3 } from '../../bootstrap/dapp-api'
import Modal from '../../components/modal'

import FundAppeal from './components/appeal'
import FundDispute from './components/fund-dispute'
import Submit from './components/submit'
import Resubmit from './components/resubmit'
import Clear from './components/clear'
import Challenge from './components/challenge'
import SubmitEvidence from './components/submit-evidence'
import {
  getTokenFormIsInvalid,
  submitTokenForm
} from './components/submit/token-form'
import {
  getEvidenceFormIsInvalid,
  submitEvidenceForm
} from './components/submit-evidence/evidence-form'

import './action-modal.css'

class ActionModal extends PureComponent {
  static propTypes = {
    token: tokenSelectors.tokenShape,
    tokenFormIsInvalid: PropTypes.bool.isRequired,
    evidenceFormIsInvalid: PropTypes.bool.isRequired,
    openActionModal: modalSelectors.openActionModalShape,
    arbitrableTokenListData:
      arbitrableTokenListSelectors.arbitrableTokenListDataShape.isRequired,
    accounts: walletSelectors.accountsShape.isRequired,

    closeActionModal: PropTypes.func.isRequired,
    fetchArbitrableTokenListData: PropTypes.func.isRequired,
    submitTokenForm: PropTypes.func.isRequired,
    createToken: PropTypes.func.isRequired,
    clearToken: PropTypes.func.isRequired,
    fundDispute: PropTypes.func.isRequired,
    resubmitToken: PropTypes.func.isRequired,
    fundAppeal: PropTypes.func.isRequired
  }

  static defaultProps = {
    openActionModal: null,
    token: null
  }

  handleSubmitTokenClick = token => {
    const { createToken } = this.props
    createToken({ tokenData: token })
  }

  handleResubmitTokenClick = () => {
    const { resubmitToken, token } = this.props
    resubmitToken({ tokenData: token.data })
  }

  handleClearTokenClick = () => {
    const { clearToken, token } = this.props
    clearToken({ tokenData: token.data })
  }

  handleSubmitEvidenceClick = () => {
    // TODO
    console.info('TODO')
  }

  handleChallengeClick = () => {
    const { fundDispute, token, arbitrableTokenListData } = this.props
    const { latestRequest } = token.data
    const { latestRound } = latestRequest

    const value = web3.utils
      .toBN(latestRequest.challengeReward)
      .add(web3.utils.toBN(latestRound.requiredFeeStake))
      .add(web3.utils.toBN(arbitrableTokenListData.data.arbitrationCost))
    fundDispute({
      ID: token.data.ID,
      value,
      side: tokenConstants.SIDE.Challenger
    })
  }

  handleFundRequesterClick = () => {
    const { fundDispute, token, arbitrableTokenListData } = this.props
    const { latestRequest } = token.data
    const { latestRound } = latestRequest

    const value = web3.utils
      .toBN(latestRound.requiredFeeStake)
      .add(web3.utils.toBN(arbitrableTokenListData.data.arbitrationCost))
    fundDispute({
      ID: token.data.ID,
      value,
      side: tokenConstants.SIDE.Requester
    })
  }

  handleFundChallengerClick = () => {
    const { fundDispute, token, arbitrableTokenListData } = this.props
    const { latestRequest } = token.data
    const { latestRound } = latestRequest
    const { arbitrationCost } = arbitrableTokenListData.data

    const value = web3.utils
      .toBN(latestRound.requiredFeeStake)
      .add(web3.utils.toBN(arbitrationCost))
    fundDispute({
      ID: token.data.ID,
      value,
      side: tokenConstants.SIDE.Challenger
    })
  }

  handleFundAppealClick = () => {
    const { fundAppeal, token, accounts } = this.props
    const tokenData = token.data
    const { latestRequest } = tokenData
    const { latestRound } = latestRequest

    const userAccount = accounts.data[0]
    let losingSide = false
    if (
      userAccount === latestRequest.parties[tokenConstants.SIDE.Requester] &&
      latestRequest.dispute.ruling ===
        tokenConstants.RULING_OPTIONS.Refuse.toString()
    )
      losingSide = true
    else if (
      userAccount === latestRequest.parties[tokenConstants.SIDE.Challenger] &&
      latestRequest.dispute.ruling ===
        tokenConstants.RULING_OPTIONS.Accept.toString()
    )
      losingSide = true

    const value = losingSide
      ? String(
          web3.utils
            .toBN(latestRound.requiredFeeStake)
            .mul(web3.utils.toBN(2))
            .add(web3.utils.toBN(latestRequest.appealCost))
        )
      : String(
          web3.utils
            .toBN(latestRound.requiredFeeStake)
            .add(web3.utils.toBN(latestRequest.appealCost))
        )

    fundAppeal(tokenData.ID, losingSide, value)
  }

  componentDidMount() {
    const { fetchArbitrableTokenListData } = this.props
    fetchArbitrableTokenListData()
  }

  render() {
    const {
      openActionModal,
      closeActionModal,
      arbitrableTokenListData,
      submitTokenForm,
      tokenFormIsInvalid,
      evidenceFormIsInvalid,
      token
    } = this.props

    return (
      <Modal
        isOpen={openActionModal !== null}
        onRequestClose={closeActionModal}
        className="ActionModal"
      >
        {(() => {
          switch (openActionModal) {
            case modalConstants.ACTION_MODAL_ENUM.Submit:
              return (
                <Submit
                  arbitrableTokenListData={arbitrableTokenListData}
                  closeActionModal={closeActionModal}
                  submitTokenForm={submitTokenForm}
                  submitToken={this.handleSubmitTokenClick}
                  tokenFormIsInvalid={tokenFormIsInvalid}
                />
              )
            case modalConstants.ACTION_MODAL_ENUM.Clear:
              return (
                <Clear
                  name={token && token.data ? token.data.name : 'token'}
                  arbitrableTokenListData={arbitrableTokenListData}
                  closeActionModal={closeActionModal}
                  clearToken={this.handleClearTokenClick}
                />
              )
            case modalConstants.ACTION_MODAL_ENUM.Challenge:
              return (
                <Challenge
                  token={token.data}
                  name={token && token.data ? token.data.name : 'token'}
                  arbitrableTokenListData={arbitrableTokenListData}
                  closeActionModal={closeActionModal}
                  fundDispute={this.handleChallengeClick}
                />
              )
            case modalConstants.ACTION_MODAL_ENUM.Resubmit:
              return (
                <Resubmit
                  token={token.data}
                  name={token && token.data ? token.data.name : 'token'}
                  arbitrableTokenListData={arbitrableTokenListData}
                  closeActionModal={closeActionModal}
                  resubmitToken={this.handleResubmitTokenClick}
                />
              )
            case modalConstants.ACTION_MODAL_ENUM.FundRequester:
              return (
                <FundDispute
                  token={token.data}
                  name={token && token.data ? token.data.name : 'token'}
                  arbitrableTokenListData={arbitrableTokenListData}
                  closeActionModal={closeActionModal}
                  fundDispute={this.handleFundRequesterClick}
                />
              )
            case modalConstants.ACTION_MODAL_ENUM.FundChallenger:
              return (
                <FundDispute
                  token={token.data}
                  name={token && token.data ? token.data.name : 'token'}
                  arbitrableTokenListData={arbitrableTokenListData}
                  closeActionModal={closeActionModal}
                  fundDispute={this.handleFundChallengerClick}
                />
              )
            case modalConstants.ACTION_MODAL_ENUM.FundAppeal:
              return (
                <FundAppeal
                  token={token.data}
                  closeActionModal={closeActionModal}
                  fundAppeal={this.handleFundAppealClick}
                />
              )
            case modalConstants.ACTION_MODAL_ENUM.SubmitEvidence:
              return (
                <SubmitEvidence
                  closeActionModal={closeActionModal}
                  submitEvidenceForm={submitEvidenceForm}
                  submitEvidence={this.handleSubmitEvidenceClick}
                  evidenceFormIsInvalid={evidenceFormIsInvalid}
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
    openActionModal: state.modal.openActionModal,
    tokenFormIsInvalid: getTokenFormIsInvalid(state),
    evidenceFormIsInvalid: getEvidenceFormIsInvalid(state),
    arbitrableTokenListData: state.arbitrableTokenList.arbitrableTokenListData,
    token: state.token.token,
    accounts: state.wallet.accounts
  }),
  {
    closeActionModal: modalActions.closeActionModal,
    createToken: tokenActions.createToken,
    clearToken: tokenActions.clearToken,
    resubmitToken: tokenActions.resubmitToken,
    fundDispute: tokenActions.fundDispute,
    submitTokenForm,
    fetchArbitrableTokenListData:
      arbitrableTokenListActions.fetchArbitrableTokenListData,
    fundAppeal: tokenActions.fundAppeal
  }
)(ActionModal)
