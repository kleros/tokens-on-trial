import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { BeatLoader } from 'react-spinners'

import * as modalActions from '../../actions/modal'
import * as modalSelectors from '../../reducers/modal'
import * as modalConstants from '../../constants/modal'
import * as tokenConstants from '../../constants/token'
import * as tokenActions from '../../actions/token'
import * as tokenSelectors from '../../reducers/token'
import * as arbitrableTokenListActions from '../../actions/arbitrable-token-list'
import * as arbitrableTokenListSelectors from '../../reducers/arbitrable-token-list'
import * as evidenceActions from '../../actions/evidence'
import { web3 } from '../../bootstrap/dapp-api'
import Modal from '../../components/modal'
import asyncReadFile from '../../utils/async-file-reader'

import FundAppeal from './components/appeal'
import FundDispute from './components/fund-dispute'
import Submit from './components/submit'
import Clear from './components/clear'
import Challenge from './components/challenge'
import SubmitEvidence from './components/submit-evidence'
import ViewEvidence from './components/view-evidence'
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
    actionModalParam: PropTypes.shape({}),
    arbitrableTokenListData:
      arbitrableTokenListSelectors.arbitrableTokenListDataShape.isRequired,

    closeActionModal: PropTypes.func.isRequired,
    fetchArbitrableTokenListData: PropTypes.func.isRequired,
    submitTokenForm: PropTypes.func.isRequired,
    submitEvidenceForm: PropTypes.func.isRequired,
    submitEvidence: PropTypes.func.isRequired,
    createToken: PropTypes.func.isRequired,
    clearToken: PropTypes.func.isRequired,
    fundDispute: PropTypes.func.isRequired,
    challengeRequest: PropTypes.func.isRequired,
    resubmitToken: PropTypes.func.isRequired,
    fundAppeal: PropTypes.func.isRequired
  }

  static defaultProps = {
    openActionModal: null,
    actionModalParam: null,
    token: null
  }

  state = { file: null, fileInfoMessage: null }

  handleSubmitTokenClick = async token => {
    const { createToken, arbitrableTokenListData } = this.props
    const { file } = this.state
    const fileData = (await asyncReadFile(file))[0]

    const value = web3.utils
      .toBN(arbitrableTokenListData.data.challengeReward)
      .add(web3.utils.toBN(arbitrableTokenListData.data.arbitrationCost))
      .add(
        web3.utils
          .toBN(arbitrableTokenListData.data.arbitrationCost)
          .mul(
            web3.utils.toBN(arbitrableTokenListData.data.sharedStakeMultiplier)
          )
          .div(
            web3.utils.toBN(arbitrableTokenListData.data.MULTIPLIER_PRECISION)
          )
      )

    this.setState({ file: null, fileInfoMessage: null })
    createToken({ tokenData: token, fileData, file, value })
  }

  handleResubmitTokenClick = () => {
    const { resubmitToken, token } = this.props
    resubmitToken({ tokenData: token.data })
  }

  handleClearTokenClick = () => {
    const { clearToken, token, arbitrableTokenListData } = this.props

    const value = web3.utils
      .toBN(arbitrableTokenListData.data.challengeReward)
      .add(web3.utils.toBN(arbitrableTokenListData.data.arbitrationCost))
      .add(
        web3.utils
          .toBN(arbitrableTokenListData.data.arbitrationCost)
          .mul(
            web3.utils.toBN(arbitrableTokenListData.data.sharedStakeMultiplier)
          )
          .div(
            web3.utils.toBN(arbitrableTokenListData.data.MULTIPLIER_PRECISION)
          )
      )

    clearToken({ tokenData: token.data, value })
  }

  handleOnFileDropAccepted = async ([file]) => {
    if (file.size > 5e6)
      return this.setState({
        file: null,
        fileInfoMessage: 'File is too big. It must be less than 5MB.'
      })

    this.setState({
      file,
      fileInfoMessage: null
    })
  }

  handleSubmitEvidenceClick = async evidence => {
    const {
      submitEvidence,
      token: {
        data: { ID }
      }
    } = this.props
    const { file } = this.state
    const fileData = (await asyncReadFile(file))[0]
    submitEvidence({ file, evidenceData: evidence, ID, fileData })
    this.setState({ file: null, fileInfoMessage: null })
  }

  handleChallengeClick = () => {
    const { challengeRequest, token, arbitrableTokenListData } = this.props

    const value = web3.utils
      .toBN(arbitrableTokenListData.data.challengeReward)
      .add(web3.utils.toBN(arbitrableTokenListData.data.arbitrationCost))
      .add(
        web3.utils
          .toBN(arbitrableTokenListData.data.arbitrationCost)
          .mul(
            web3.utils.toBN(arbitrableTokenListData.data.sharedStakeMultiplier)
          )
          .div(
            web3.utils.toBN(arbitrableTokenListData.data.MULTIPLIER_PRECISION)
          )
      )
    challengeRequest({
      ID: token.data.ID,
      value
    })
  }

  handleFundRequesterClick = () => {
    const { fundDispute, token, arbitrableTokenListData } = this.props

    const value = web3.utils
      .toBN(arbitrableTokenListData.data.arbitrationCost)
      .add(
        web3.utils
          .toBN(arbitrableTokenListData.data.arbitrationCost)
          .mul(
            web3.utils.toBN(arbitrableTokenListData.data.sharedStakeMultiplier)
          )
          .div(
            web3.utils.toBN(arbitrableTokenListData.data.MULTIPLIER_PRECISION)
          )
      )

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
    const {
      fundAppeal,
      token,
      arbitrableTokenListData,
      actionModalParam
    } = this.props
    const tokenData = token.data
    const { latestRequest } = tokenData
    const SIDE = actionModalParam

    let losingSide = false
    if (
      SIDE === tokenConstants.SIDE.Requester &&
      latestRequest.dispute.ruling ===
        tokenConstants.RULING_OPTIONS.Refuse.toString()
    )
      losingSide = true
    else if (
      SIDE === tokenConstants.SIDE.Challenger &&
      latestRequest.dispute.ruling ===
        tokenConstants.RULING_OPTIONS.Accept.toString()
    )
      losingSide = true

    const value = web3.utils
      .toBN(arbitrableTokenListData.data.arbitrationCost)
      .add(
        web3.utils
          .toBN(arbitrableTokenListData.data.arbitrationCost)
          .mul(
            web3.utils.toBN(
              losingSide
                ? arbitrableTokenListData.data.loserStakeMultiplier
                : arbitrableTokenListData.data.winnerStakeMultiplier
            )
          )
          .div(
            web3.utils.toBN(arbitrableTokenListData.data.MULTIPLIER_PRECISION)
          )
      )

    fundAppeal(tokenData.ID, SIDE, value)
  }

  componentDidMount() {
    const { fetchArbitrableTokenListData } = this.props
    fetchArbitrableTokenListData()
  }

  componentDidUpdate(prevProps) {
    const { token: prevToken } = prevProps
    const { token, closeActionModal } = this.props
    if (
      (prevToken.creating && !token.creating) ||
      (prevToken.updating && !token.updating)
    )
      closeActionModal()
  }

  render() {
    const {
      openActionModal,
      closeActionModal,
      arbitrableTokenListData,
      submitTokenForm,
      submitEvidenceForm,
      tokenFormIsInvalid,
      evidenceFormIsInvalid,
      token,
      actionModalParam
    } = this.props

    const { fileInfoMessage, file } = this.state

    return (
      <Modal
        className="ActionModal"
        isOpen={openActionModal !== null}
        onRequestClose={closeActionModal}
      >
        {!token.creating && !token.updating ? (
          (() => {
            switch (openActionModal) {
              case modalConstants.ACTION_MODAL_ENUM.Submit:
              case modalConstants.ACTION_MODAL_ENUM.Resubmit:
                return (
                  <Submit
                    arbitrableTokenListData={arbitrableTokenListData}
                    closeActionModal={closeActionModal}
                    file={file}
                    fileInfoMessage={fileInfoMessage}
                    handleOnFileDropAccepted={this.handleOnFileDropAccepted}
                    submitToken={this.handleSubmitTokenClick}
                    submitTokenForm={submitTokenForm}
                    token={token}
                    tokenFormIsInvalid={tokenFormIsInvalid}
                  />
                )
              case modalConstants.ACTION_MODAL_ENUM.Clear:
                return (
                  <Clear
                    arbitrableTokenListData={arbitrableTokenListData}
                    clearToken={this.handleClearTokenClick}
                    closeActionModal={closeActionModal}
                    name={token && token.data ? token.data.name : 'token'}
                  />
                )
              case modalConstants.ACTION_MODAL_ENUM.Challenge:
                return (
                  <Challenge
                    arbitrableTokenListData={arbitrableTokenListData}
                    closeActionModal={closeActionModal}
                    fundDispute={this.handleChallengeClick}
                    name={token && token.data ? token.data.name : 'token'}
                    token={token.data}
                  />
                )
              case modalConstants.ACTION_MODAL_ENUM.FundRequester:
                return (
                  <FundDispute
                    arbitrableTokenListData={arbitrableTokenListData}
                    closeActionModal={closeActionModal}
                    fundDispute={this.handleFundRequesterClick}
                    name={token && token.data ? token.data.name : 'token'}
                    token={token.data}
                  />
                )
              case modalConstants.ACTION_MODAL_ENUM.FundChallenger:
                return (
                  <FundDispute
                    arbitrableTokenListData={arbitrableTokenListData}
                    closeActionModal={closeActionModal}
                    fundDispute={this.handleFundChallengerClick}
                    name={token && token.data ? token.data.name : 'token'}
                    token={token.data}
                  />
                )
              case modalConstants.ACTION_MODAL_ENUM.FundAppeal:
                return (
                  <FundAppeal
                    closeActionModal={closeActionModal}
                    fundAppeal={this.handleFundAppealClick}
                    token={token.data}
                    arbitrableTokenListData={arbitrableTokenListData}
                  />
                )
              case modalConstants.ACTION_MODAL_ENUM.SubmitEvidence:
                return (
                  <SubmitEvidence
                    closeActionModal={closeActionModal}
                    evidenceFormIsInvalid={evidenceFormIsInvalid}
                    file={file}
                    fileInfoMessage={fileInfoMessage}
                    handleOnFileDropAccepted={this.handleOnFileDropAccepted}
                    submitEvidence={this.handleSubmitEvidenceClick}
                    submitEvidenceForm={submitEvidenceForm}
                  />
                )
              case modalConstants.ACTION_MODAL_ENUM.ViewEvidence:
                return (
                  <ViewEvidence
                    closeActionModal={closeActionModal}
                    evidence={actionModalParam}
                  />
                )
              case undefined:
              case null:
                break
              default:
                throw new Error('Unhandled modal request')
            }
          })()
        ) : (
          <div>
            <small>
              <h5>Transaction pending...</h5>
            </small>
            <BeatLoader color="#3d464d" />
          </div>
        )}
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
    accounts: state.wallet.accounts,
    actionModalParam: state.modal.actionModalParam
  }),
  {
    closeActionModal: modalActions.closeActionModal,
    createToken: tokenActions.createToken,
    submitEvidence: evidenceActions.submitEvidence,
    clearToken: tokenActions.clearToken,
    resubmitToken: tokenActions.resubmitToken,
    fundDispute: tokenActions.fundDispute,
    challengeRequest: tokenActions.challengeRequest,
    submitTokenForm,
    submitEvidenceForm,
    fetchArbitrableTokenListData:
      arbitrableTokenListActions.fetchArbitrableTokenListData,
    fundAppeal: tokenActions.fundAppeal
  }
)(ActionModal)
