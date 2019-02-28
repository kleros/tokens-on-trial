import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { BeatLoader } from 'react-spinners'

import * as modalActions from '../../actions/modal'
import * as modalSelectors from '../../reducers/modal'
import * as modalConstants from '../../constants/modal'
import * as tcrConstants from '../../constants/tcr'
import * as tokenActions from '../../actions/token'
import * as badgeActions from '../../actions/badge'
import * as tokenSelectors from '../../reducers/token'
import * as badgeSelectors from '../../reducers/badge'
import * as arbitrableTokenListActions from '../../actions/arbitrable-token-list'
import * as arbitrableAddressListActions from '../../actions/arbitrable-address-list'
import * as arbitrableTokenListSelectors from '../../reducers/arbitrable-token-list'
import * as arbitrableAddressListSelectors from '../../reducers/arbitrable-address-list'
import { web3, archon } from '../../bootstrap/dapp-api'
import Modal from '../../components/modal'
import asyncReadFile from '../../utils/async-file-reader'
import ipfsPublish from '../../sagas/api/ipfs-publish'

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
    badge: badgeSelectors.badgeShape,
    tokenFormIsInvalid: PropTypes.bool.isRequired,
    evidenceFormIsInvalid: PropTypes.bool.isRequired,
    openActionModal: modalSelectors.openActionModalShape,
    closeActionModal: PropTypes.func.isRequired,
    actionModalParam: PropTypes.shape({}),
    arbitrableTokenListData:
      arbitrableTokenListSelectors.arbitrableTokenListDataShape.isRequired,
    arbitrableAddressListData:
      arbitrableAddressListSelectors.arbitrableAddressListDataShape.isRequired,

    // Token actions
    fetchArbitrableTokenListData: PropTypes.func.isRequired,
    fetchArbitrableAddressListData: PropTypes.func.isRequired,
    submitTokenForm: PropTypes.func.isRequired,
    submitTokenEvidence: PropTypes.func.isRequired,
    submitEvidenceForm: PropTypes.func.isRequired,
    createToken: PropTypes.func.isRequired,
    clearToken: PropTypes.func.isRequired,
    fundDispute: PropTypes.func.isRequired,
    challengeRequest: PropTypes.func.isRequired,
    resubmitToken: PropTypes.func.isRequired,
    fundAppeal: PropTypes.func.isRequired,

    // Badge actions
    createBadge: PropTypes.func.isRequired,
    clearBadge: PropTypes.func.isRequired,
    submitBadgeEvidence: PropTypes.func.isRequired,
    challengeBadgeRequest: PropTypes.func.isRequired,
    fundBadgeDispute: PropTypes.func.isRequired,
    fundBadgeAppeal: PropTypes.func.isRequired
  }

  static defaultProps = {
    openActionModal: null,
    actionModalParam: null,
    token: null,
    badge: null
  }

  state = { file: null, fileInfoMessage: null }

  handleSubmitTokenClick = async token => {
    const { createToken, arbitrableTokenListData } = this.props
    const {
      arbitrationCost,
      sharedStakeMultiplier,
      MULTIPLIER_DIVISOR,
      requesterBaseDeposit
    } = arbitrableTokenListData.data
    const { file } = this.state
    const fileData = (await asyncReadFile(file))[0]

    const value = web3.utils
      .toBN(requesterBaseDeposit)
      .add(web3.utils.toBN(arbitrationCost))
      .add(
        web3.utils
          .toBN(arbitrationCost)
          .mul(web3.utils.toBN(sharedStakeMultiplier))
          .div(web3.utils.toBN(MULTIPLIER_DIVISOR))
      )

    this.setState({ file: null, fileInfoMessage: null })
    createToken({ tokenData: token, fileData, file, value })
  }

  handleResubmitTokenClick = () => {
    const { resubmitToken, token, arbitrableTokenListData } = this.props
    const {
      arbitrationCost,
      sharedStakeMultiplier,
      MULTIPLIER_DIVISOR,
      requesterBaseDeposit
    } = arbitrableTokenListData.data
    const value = web3.utils
      .toBN(requesterBaseDeposit)
      .add(web3.utils.toBN(arbitrationCost))
      .add(
        web3.utils
          .toBN(arbitrationCost)
          .mul(web3.utils.toBN(sharedStakeMultiplier))
          .div(web3.utils.toBN(MULTIPLIER_DIVISOR))
      )
    resubmitToken({ tokenData: token.data, value })
  }

  handleClearTokenClick = () => {
    const { clearToken, token, arbitrableTokenListData } = this.props
    const {
      arbitrationCost,
      sharedStakeMultiplier,
      MULTIPLIER_DIVISOR,
      requesterBaseDeposit
    } = arbitrableTokenListData.data

    const value = web3.utils
      .toBN(requesterBaseDeposit)
      .add(web3.utils.toBN(arbitrationCost))
      .add(
        web3.utils
          .toBN(arbitrationCost)
          .mul(web3.utils.toBN(sharedStakeMultiplier))
          .div(web3.utils.toBN(MULTIPLIER_DIVISOR))
      )

    clearToken({ tokenData: token.data, value })
  }

  handleClearBadgeClick = () => {
    const { clearBadge, badge, arbitrableAddressListData } = this.props
    const {
      arbitrationCost,
      sharedStakeMultiplier,
      MULTIPLIER_DIVISOR,
      requesterBaseDeposit
    } = arbitrableAddressListData.data

    const value = web3.utils
      .toBN(requesterBaseDeposit)
      .add(web3.utils.toBN(arbitrationCost))
      .add(
        web3.utils
          .toBN(arbitrationCost)
          .mul(web3.utils.toBN(sharedStakeMultiplier))
          .div(web3.utils.toBN(MULTIPLIER_DIVISOR))
      )

    clearBadge({ badgeData: badge.data, value })
  }

  handleOnFileDropAccepted = ([file]) => {
    if (file.size > 1e6)
      return this.setState({
        file: null,
        fileInfoMessage: 'File is too big. It must be less than 1MB.'
      })

    this.setState({
      file,
      fileInfoMessage: null
    })
  }

  handleSubmitEvidenceClick = evidence => {
    const { submitTokenEvidence, closeActionModal, token } = this.props
    const { file } = this.state

    submitTokenEvidence({
      file,
      evidenceData: evidence,
      ID: token.data.ID
    })
    this.setState({ file: null, fileInfoMessage: null })
    closeActionModal()
  }

  handleSubmitEvidenceBadgeClick = evidence => {
    const {
      submitBadgeEvidence,
      closeActionModal,
      badge: {
        data: { addr }
      }
    } = this.props
    const { file } = this.state
    submitBadgeEvidence({ file, evidenceData: evidence, addr })
    this.setState({ file: null, fileInfoMessage: null })
    closeActionModal()
  }

  handleChallengeClick = async ({ reason }) => {
    const { challengeRequest, token, arbitrableTokenListData } = this.props
    const {
      challengerBaseDeposit,
      arbitrationCost,
      sharedStakeMultiplier,
      MULTIPLIER_DIVISOR
    } = arbitrableTokenListData.data

    const evidenceJSON = {
      name: 'Token challenge',
      description: reason,
      fileURI: '',
      fileTypeExtension: ''
    }

    /* eslint-disable unicorn/number-literal-case */
    const evidenceJSONMultihash = archon.utils.multihashFile(evidenceJSON, 0x1b) // 0x1b is keccak-256
    /* eslint-enable */

    const enc = new TextEncoder()
    const ipfsHashEvidenceObj = await ipfsPublish(
      evidenceJSONMultihash,
      enc.encode(JSON.stringify(evidenceJSON))
    )

    const ipfsHashEvidence =
      ipfsHashEvidenceObj[1].hash + ipfsHashEvidenceObj[0].path

    const value = web3.utils
      .toBN(challengerBaseDeposit)
      .add(web3.utils.toBN(arbitrationCost))
      .add(
        web3.utils
          .toBN(arbitrationCost)
          .mul(web3.utils.toBN(sharedStakeMultiplier))
          .div(web3.utils.toBN(MULTIPLIER_DIVISOR))
      )
    challengeRequest({
      ID: token.data.ID,
      value,
      evidence: `/ipfs/${ipfsHashEvidence}`
    })
  }

  handleChallengeBadgeClick = async ({ reason }) => {
    const {
      challengeBadgeRequest,
      badge,
      arbitrableAddressListData
    } = this.props
    const {
      challengerBaseDeposit,
      arbitrationCost,
      sharedStakeMultiplier,
      MULTIPLIER_DIVISOR
    } = arbitrableAddressListData.data

    const evidenceJSON = {
      name: `Badge challenge`,
      description: reason,
      fileURI: '',
      fileTypeExtension: ''
    }

    /* eslint-disable unicorn/number-literal-case */
    const evidenceJSONMultihash = archon.utils.multihashFile(evidenceJSON, 0x1b) // 0x1b is keccak-256
    /* eslint-enable */

    const enc = new TextEncoder()
    const ipfsHashEvidenceObj = await ipfsPublish(
      evidenceJSONMultihash,
      enc.encode(JSON.stringify(evidenceJSON))
    )

    const ipfsHashEvidence =
      ipfsHashEvidenceObj[1].hash + ipfsHashEvidenceObj[0].path

    const value = web3.utils
      .toBN(challengerBaseDeposit)
      .add(web3.utils.toBN(arbitrationCost))
      .add(
        web3.utils
          .toBN(arbitrationCost)
          .mul(web3.utils.toBN(sharedStakeMultiplier))
          .div(web3.utils.toBN(MULTIPLIER_DIVISOR))
      )
    challengeBadgeRequest({
      addr: badge.data.addr,
      evidence: `/ipfs/${ipfsHashEvidence}`,
      value
    })
  }

  handleFundRequesterClick = () => {
    const { fundDispute, token, arbitrableTokenListData } = this.props
    const {
      arbitrationCost,
      sharedStakeMultiplier,
      MULTIPLIER_DIVISOR
    } = arbitrableTokenListData.data

    const value = web3.utils.toBN(arbitrationCost).add(
      web3.utils
        .toBN(arbitrationCost)
        .mul(web3.utils.toBN(sharedStakeMultiplier))
        .div(web3.utils.toBN(MULTIPLIER_DIVISOR))
    )

    fundDispute({
      ID: token.data.ID,
      value,
      side: tcrConstants.SIDE.Requester
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
      side: tcrConstants.SIDE.Challenger
    })
  }

  handleFundChallengerBadgeClick = () => {
    const { fundBadgeDispute, token, arbitrableTokenListData } = this.props
    const { badge } = token.data
    const { latestRequest } = badge.data
    const { latestRound } = latestRequest
    const { arbitrationCost } = arbitrableTokenListData.data

    const value = web3.utils
      .toBN(latestRound.requiredFeeStake)
      .add(web3.utils.toBN(arbitrationCost))
    fundBadgeDispute({
      addr: token.data.addr,
      ID: token.data.ID,
      value,
      side: tcrConstants.SIDE.Challenger
    })
  }

  handleFundAppealClick = ({ amount }) => {
    const { fundAppeal, token, actionModalParam } = this.props
    const tokenData = token.data
    const SIDE = actionModalParam
    const value = web3.utils.toWei(amount)

    fundAppeal(tokenData.ID, SIDE, value)
  }

  handleFundAppealBadgeClick = ({ amount }) => {
    const { fundBadgeAppeal, badge, actionModalParam } = this.props
    const SIDE = actionModalParam
    const value = web3.utils.toWei(amount)

    fundBadgeAppeal(badge.data.addr, SIDE, value)
  }

  handleSubmitBadgeClick = () => {
    const { createBadge, arbitrableAddressListData, token } = this.props
    let { badge } = this.props

    badge = !badge.data ? { addr: token.data.addr } : badge.data
    const {
      arbitrationCost,
      sharedStakeMultiplier,
      requesterBaseDeposit,
      MULTIPLIER_DIVISOR
    } = arbitrableAddressListData.data

    const value = web3.utils
      .toBN(requesterBaseDeposit)
      .add(web3.utils.toBN(arbitrationCost))
      .add(
        web3.utils
          .toBN(arbitrationCost)
          .mul(web3.utils.toBN(sharedStakeMultiplier))
          .div(web3.utils.toBN(MULTIPLIER_DIVISOR))
      )

    this.setState({ file: null, fileInfoMessage: null })
    createBadge({ badgeData: badge, value })
  }

  handleCloseTokenSubmission = () => {
    const { closeActionModal } = this.props
    this.setState({ file: null, fileInfoMessage: null })
    closeActionModal()
  }

  componentDidMount() {
    const {
      fetchArbitrableTokenListData,
      fetchArbitrableAddressListData
    } = this.props
    fetchArbitrableTokenListData()
    fetchArbitrableAddressListData()
  }

  componentDidUpdate(prevProps) {
    const { token: prevToken, badge: prevBadge } = prevProps
    const { token, badge, closeActionModal } = this.props
    if (
      (prevToken.creating && !token.creating) ||
      (prevToken.updating && !token.updating) ||
      (prevBadge.creating && !badge.creating) ||
      (prevBadge.updating && !badge.updating)
    )
      closeActionModal()
  }

  render() {
    const {
      openActionModal,
      closeActionModal,
      arbitrableTokenListData,
      arbitrableAddressListData,
      submitTokenForm,
      submitEvidenceForm,
      tokenFormIsInvalid,
      evidenceFormIsInvalid,
      token,
      badge,
      actionModalParam
    } = this.props

    const { fileInfoMessage, file } = this.state

    if (token.creating || token.updating || badge.creating || badge.updating)
      return (
        <Modal className="ActionModal" isOpen={openActionModal !== null}>
          <div>
            <small>
              <h5>Transaction pending...</h5>
            </small>
            <BeatLoader color="#3d464d" />
          </div>
        </Modal>
      )

    return (
      <Modal
        className="ActionModal"
        isOpen={openActionModal !== null}
        onRequestClose={closeActionModal}
      >
        {(() => {
          switch (openActionModal) {
            case modalConstants.ACTION_MODAL_ENUM.Submit:
            case modalConstants.ACTION_MODAL_ENUM.Resubmit:
              return (
                <Submit
                  tcr={arbitrableTokenListData}
                  form={submitTokenForm}
                  submitItem={this.handleSubmitTokenClick}
                  submitItemForm={submitTokenForm}
                  file={file}
                  formIsInvalid={tokenFormIsInvalid}
                  fileInfoMessage={fileInfoMessage}
                  handleOnFileDropAccepted={this.handleOnFileDropAccepted}
                  closeActionModal={this.handleCloseTokenSubmission}
                  item={
                    openActionModal === modalConstants.ACTION_MODAL_ENUM.Submit
                      ? null
                      : token
                  }
                  resubmit={this.handleResubmitTokenClick}
                />
              )
            case modalConstants.ACTION_MODAL_ENUM.Clear:
              return (
                <Clear
                  tcr={arbitrableTokenListData}
                  item={token.data}
                  clearItem={this.handleClearTokenClick}
                  closeActionModal={closeActionModal}
                />
              )
            case modalConstants.ACTION_MODAL_ENUM.Challenge:
              return (
                <Challenge
                  tcr={arbitrableTokenListData}
                  item={token.data}
                  closeActionModal={closeActionModal}
                  fundDispute={this.handleChallengeClick}
                />
              )
            case modalConstants.ACTION_MODAL_ENUM.FundRequester:
              return (
                <FundDispute
                  tcr={arbitrableTokenListData}
                  closeActionModal={closeActionModal}
                  fundDispute={this.handleFundRequesterClick}
                />
              )
            case modalConstants.ACTION_MODAL_ENUM.FundChallenger:
              return (
                <FundDispute
                  tcr={arbitrableTokenListData}
                  closeActionModal={closeActionModal}
                  fundDispute={this.handleFundChallengerClick}
                />
              )
            case modalConstants.ACTION_MODAL_ENUM.FundAppeal:
              return (
                <FundAppeal
                  tcr={arbitrableTokenListData}
                  item={token.data}
                  closeActionModal={closeActionModal}
                  fundAppeal={this.handleFundAppealClick}
                  side={actionModalParam}
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
            case modalConstants.ACTION_MODAL_ENUM.SubmitBadge:
            case modalConstants.ACTION_MODAL_ENUM.ResubmitBadge:
              return (
                <Submit
                  tcr={arbitrableAddressListData}
                  submitItem={this.handleSubmitBadgeClick}
                  closeActionModal={closeActionModal}
                  badge
                />
              )
            case modalConstants.ACTION_MODAL_ENUM.ClearBadge:
              return (
                <Clear
                  tcr={arbitrableAddressListData}
                  closeActionModal={closeActionModal}
                  clearItem={this.handleClearBadgeClick}
                  item={badge}
                  badge
                />
              )
            case modalConstants.ACTION_MODAL_ENUM.ChallengeBadge:
              return (
                <Challenge
                  tcr={arbitrableAddressListData}
                  closeActionModal={closeActionModal}
                  item={badge}
                  fundDispute={this.handleChallengeBadgeClick}
                  badge
                />
              )
            case modalConstants.ACTION_MODAL_ENUM.FundRequesterBadge:
              return (
                <FundDispute
                  tcr={arbitrableAddressListData}
                  closeActionModal={closeActionModal}
                  item={badge}
                  badge
                />
              )
            case modalConstants.ACTION_MODAL_ENUM.FundChallengerBadge:
              return (
                <FundDispute
                  tcr={arbitrableAddressListData}
                  closeActionModal={closeActionModal}
                  fundDispute={this.handleFundChallengerBadgeClick}
                  item={badge}
                  badge
                />
              )
            case modalConstants.ACTION_MODAL_ENUM.FundAppealBadge: {
              return (
                <FundAppeal
                  tcr={arbitrableAddressListData}
                  closeActionModal={closeActionModal}
                  item={badge.data}
                  badge
                  fundAppeal={this.handleFundAppealBadgeClick}
                  side={actionModalParam}
                />
              )
            }
            case modalConstants.ACTION_MODAL_ENUM.SubmitEvidenceBadge:
              return (
                <SubmitEvidence
                  tcr={arbitrableAddressListData}
                  closeActionModal={closeActionModal}
                  item={token.data.badge}
                  evidenceFormIsInvalid={evidenceFormIsInvalid}
                  file={file}
                  fileInfoMessage={fileInfoMessage}
                  handleOnFileDropAccepted={this.handleOnFileDropAccepted}
                  submitEvidence={this.handleSubmitEvidenceBadgeClick}
                  submitEvidenceForm={submitEvidenceForm}
                  badge
                />
              )
            case modalConstants.ACTION_MODAL_ENUM.TxPending: // Used to display transaction pending indicator
              return <div />
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
    arbitrableAddressListData:
      state.arbitrableAddressList.arbitrableAddressListData,
    token: state.token.token,
    accounts: state.wallet.accounts,
    actionModalParam: state.modal.actionModalParam,
    badge: state.badge.badge
  }),
  {
    closeActionModal: modalActions.closeActionModal,
    fetchArbitrableAddressListData:
      arbitrableAddressListActions.fetchArbitrableAddressListData,
    fetchArbitrableTokenListData:
      arbitrableTokenListActions.fetchArbitrableTokenListData,

    // Token actions
    createToken: tokenActions.createToken,
    submitTokenEvidence: arbitrableTokenListActions.submitTokenEvidence,
    clearToken: tokenActions.clearToken,
    resubmitToken: tokenActions.resubmitToken,
    fundDispute: tokenActions.fundDispute,
    challengeRequest: tokenActions.challengeRequest,
    submitTokenForm,
    submitEvidenceForm,
    fundAppeal: tokenActions.fundAppeal,

    // Badge actions
    createBadge: badgeActions.createBadge,
    submitBadgeEvidence: arbitrableAddressListActions.submitBadgeEvidence,
    clearBadge: badgeActions.clearBadge,
    resubmitBadge: badgeActions.resubmitBadge,
    fundBadgeDispute: badgeActions.fundDispute,
    challengeBadgeRequest: badgeActions.challengeRequest,
    fundBadgeAppeal: badgeActions.fundAppeal
  }
)(ActionModal)
