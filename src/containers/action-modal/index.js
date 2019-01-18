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
import * as walletSelectors from '../../reducers/wallet'
import * as evidenceActions from '../../actions/evidence'
import { web3 } from '../../bootstrap/dapp-api'
import Modal from '../../components/modal'
import asyncReadFile from '../../utils/async-file-reader'
import Button from '../../components/button'

import FundAppeal from './components/appeal'
import FundDispute from './components/fund-dispute'
import Submit from './components/submit'
import Resubmit from './components/resubmit'
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
    accounts: walletSelectors.accountsShape.isRequired,

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

  state = { file: null, fileInfoMessage: null, txResult: null }

  handleSubmitTokenClick = async token => {
    const { createToken } = this.props
    const { file } = this.state
    const fileData = (await asyncReadFile(file))[0]
    createToken({ tokenData: token, fileData, file })
  }

  handleResubmitTokenClick = () => {
    const { resubmitToken, token } = this.props
    resubmitToken({ tokenData: token.data })
  }

  handleClearTokenClick = () => {
    const { clearToken, token } = this.props
    clearToken({ tokenData: token.data })
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
    const { fundAppeal, token, accounts, arbitrableTokenListData } = this.props
    const tokenData = token.data
    const { latestRequest } = tokenData

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

    const side =
      userAccount === latestRequest.parties[tokenConstants.SIDE.Challenger]
        ? tokenConstants.SIDE.Challenger
        : tokenConstants.SIDE.Requester

    fundAppeal(tokenData.ID, side, value)
  }

  componentDidMount() {
    const { fetchArbitrableTokenListData } = this.props
    fetchArbitrableTokenListData()
  }

  componentDidUpdate(prevProps) {
    const { token: prevToken } = prevProps
    const { token } = this.props
    if (
      (prevToken.creating && !token.creating) ||
      (prevToken.updating && !token.updating)
    )
      this.setState({
        txResult:
          token.failedCreating || token.failedUpdating ? 'fail' : 'success'
      })
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

    const { fileInfoMessage, file, txResult } = this.state

    if (txResult === 'success' || txResult === 'fail')
      return (
        <Modal
          isOpen={openActionModal !== null}
          onRequestClose={closeActionModal}
          className="ActionModal"
        >
          <h5>
            Transaction {txResult === 'success' ? 'Successful.' : 'Failed.'}
          </h5>
          <Button
            className="Appeal-return"
            type="secondary"
            onClick={closeActionModal}
          >
            Return
          </Button>
        </Modal>
      )

    return (
      <Modal
        isOpen={openActionModal !== null}
        onRequestClose={closeActionModal}
        className="ActionModal"
      >
        {!token.creating && !token.updating ? (
          (() => {
            switch (openActionModal) {
              case modalConstants.ACTION_MODAL_ENUM.Submit:
                return (
                  <Submit
                    arbitrableTokenListData={arbitrableTokenListData}
                    closeActionModal={closeActionModal}
                    submitTokenForm={submitTokenForm}
                    token={token}
                    submitToken={this.handleSubmitTokenClick}
                    tokenFormIsInvalid={tokenFormIsInvalid}
                    handleOnFileDropAccepted={this.handleOnFileDropAccepted}
                    fileInfoMessage={fileInfoMessage}
                    file={file}
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
                    handleOnFileDropAccepted={this.handleOnFileDropAccepted}
                    fileInfoMessage={fileInfoMessage}
                    file={file}
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
          <BeatLoader color="#3d464d" />
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
