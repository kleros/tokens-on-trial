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
import { web3Utils } from '../../bootstrap/dapp-api'
import Modal from '../../components/modal'
import asyncReadFile from '../../utils/async-file-reader'
import ipfsPublish from '../../sagas/api/ipfs-publish'
import { ContractsContext } from '../../bootstrap/contexts'
import FundAppeal from './components/appeal'
import FundDispute from './components/fund-dispute'
import Submit from './components/submit'
import Clear from './components/clear'
import Challenge from './components/challenge'
import SubmitEvidence from './components/submit-evidence'
import ViewEvidence from './components/view-evidence'
import AddBadge from './components/add-badge'
import SubmitBadge from './components/submit-badge'
import {
  getTokenFormIsInvalid,
  submitTokenForm,
} from './components/submit/token-form'
import {
  getEvidenceFormIsInvalid,
  submitEvidenceForm,
} from './components/submit-evidence/evidence-form'
import './action-modal.css'
import { instantiateEnvObjects } from '../../utils/tcr'

class ActionModal extends PureComponent {
  static propTypes = {
    token: tokenSelectors.tokenShape,
    badge: badgeSelectors.badgeShape,
    tokenFormIsInvalid: PropTypes.bool.isRequired,
    evidenceFormIsInvalid: PropTypes.bool.isRequired,
    openActionModal: modalSelectors.openActionModalShape,
    closeActionModal: PropTypes.func.isRequired,
    actionModalParam: PropTypes.shape({}),
    envObjects: PropTypes.shape({
      T2CR_SUBGRAPH_URL: PropTypes.string.isRequired,
    }).isRequired,
    arbitrableTokenListData:
      arbitrableTokenListSelectors.arbitrableTokenListDataShape.isRequired,
    badgeContracts: PropTypes.objectOf(
      arbitrableAddressListSelectors._arbitrableAddressListDataShape
    ),

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
    fundBadgeAppeal: PropTypes.func.isRequired,
  }

  static contextType = ContractsContext

  static defaultProps = {
    openActionModal: null,
    actionModalParam: null,
    token: null,
    badge: null,
    badgeContracts: null,
  }

  state = { file: null, fileInfoMessage: null }

  handleSubmitTokenClick = async (token) => {
    const { createToken, arbitrableTokenListData } = this.props
    const {
      arbitrationCost,
      sharedStakeMultiplier,
      MULTIPLIER_DIVISOR,
      requesterBaseDeposit,
    } = arbitrableTokenListData.data
    const { file } = this.state
    const fileData = (await asyncReadFile(file))[0]

    const value = requesterBaseDeposit
      .add(arbitrationCost)
      .add(arbitrationCost.mul(sharedStakeMultiplier).div(MULTIPLIER_DIVISOR))

    this.setState({ file: null, fileInfoMessage: null })
    createToken({ tokenData: token, fileData, file, value })
  }

  handleResubmitTokenClick = () => {
    const { resubmitToken, token, arbitrableTokenListData } = this.props
    const {
      arbitrationCost,
      sharedStakeMultiplier,
      MULTIPLIER_DIVISOR,
      requesterBaseDeposit,
    } = arbitrableTokenListData.data
    const value = requesterBaseDeposit
      .add(arbitrationCost)
      .add(arbitrationCost.mul(sharedStakeMultiplier).div(MULTIPLIER_DIVISOR))
    resubmitToken({ tokenData: token.data, value })
  }

  handleClearTokenClick = () => {
    const { clearToken, token, arbitrableTokenListData } = this.props
    const {
      arbitrationCost,
      sharedStakeMultiplier,
      MULTIPLIER_DIVISOR,
      requesterBaseDeposit,
    } = arbitrableTokenListData.data

    const value = requesterBaseDeposit
      .add(arbitrationCost)
      .add(arbitrationCost.mul(sharedStakeMultiplier).div(MULTIPLIER_DIVISOR))

    clearToken({ tokenData: token.data, value })
  }

  handleClearBadgeClick = ({ badgeContractAddr }) => {
    const { clearBadge, badge, badgeContracts } = this.props
    const arbitrableAddressListData = badgeContracts[badgeContractAddr]
    const {
      arbitrationCost,
      sharedStakeMultiplier,
      MULTIPLIER_DIVISOR,
      requesterBaseDeposit,
    } = arbitrableAddressListData

    const value = requesterBaseDeposit
      .add(arbitrationCost)
      .add(arbitrationCost.mul(sharedStakeMultiplier).div(MULTIPLIER_DIVISOR))

    clearBadge({ tokenAddr: badge.data.tokenAddress, badgeContractAddr, value })
  }

  handleOnFileDropAccepted = ([file]) => {
    if (file.size > 1e6)
      return this.setState({
        file: null,
        fileInfoMessage: 'File is too big. It must be less than 1MB.',
      })

    this.setState({
      file,
      fileInfoMessage: null,
    })
  }

  handleOnImageDropAccepted = ([file]) => {
    if (file.type !== 'image/png')
      return this.setState({
        file: null,
        fileInfoMessage: 'File should be a PNG with a transparent background.',
      })

    if (file.size > 1e6)
      return this.setState({
        file: null,
        fileInfoMessage: 'File is too big. It must be less than 1MB.',
      })

    this.setState({
      file,
      fileInfoMessage: null,
    })
  }

  handleSubmitEvidenceClick = (evidence, evidenceSide) => {
    const { submitTokenEvidence, closeActionModal, token } = this.props
    const { file } = this.state

    submitTokenEvidence({
      file,
      evidenceData: evidence,
      ID: token.data.ID,
      evidenceSide,
    })
    this.setState({ file: null, fileInfoMessage: null })
    closeActionModal()
  }

  handleSubmitEvidenceBadgeClick = (evidence, evidenceSide) => {
    const {
      submitBadgeEvidence,
      closeActionModal,
      badge: {
        data: { tokenAddress },
      },
      actionModalParam: { badgeContractAddr },
    } = this.props
    const { file } = this.state
    submitBadgeEvidence({
      file,
      evidenceData: evidence,
      tokenAddress,
      badgeContractAddr,
      evidenceSide,
    })
    this.setState({ file: null, fileInfoMessage: null })
    closeActionModal()
  }

  handleChallengeClick = async ({ reason }) => {
    const { challengeRequest, token, arbitrableTokenListData } = this.props
    const { archon } = this.context
    const {
      challengerBaseDeposit,
      arbitrationCost,
      sharedStakeMultiplier,
      MULTIPLIER_DIVISOR,
    } = arbitrableTokenListData.data

    const evidenceJSON = {
      name: 'Token challenge',
      description: reason,
      fileURI: '',
      fileTypeExtension: '',
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

    const value = challengerBaseDeposit
      .add(arbitrationCost)
      .add(arbitrationCost.mul(sharedStakeMultiplier).div(MULTIPLIER_DIVISOR))
    challengeRequest({
      ID: token.data.ID,
      value,
      evidence: `/ipfs/${ipfsHashEvidence}`,
    })
  }

  handleChallengeBadgeClick = async ({ reason }) => {
    const {
      challengeBadgeRequest,
      badge,
      badgeContracts,
      actionModalParam: { badgeContractAddr },
    } = this.props

    const arbitrableAddressListData = badgeContracts[badgeContractAddr]
    const { archon } = this.context
    const {
      challengerBaseDeposit,
      arbitrationCost,
      sharedStakeMultiplier,
      MULTIPLIER_DIVISOR,
    } = arbitrableAddressListData

    const evidenceJSON = {
      name: `Badge challenge`,
      description: reason,
      fileURI: '',
      fileTypeExtension: '',
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

    const value = challengerBaseDeposit
      .add(arbitrationCost)
      .add(arbitrationCost.mul(sharedStakeMultiplier).div(MULTIPLIER_DIVISOR))

    challengeBadgeRequest({
      tokenAddr: badge.data.tokenAddress,
      badgeContractAddr,
      evidence: `/ipfs/${ipfsHashEvidence}`,
      value,
    })
  }

  handleFundRequesterClick = () => {
    const { fundDispute, token, arbitrableTokenListData } = this.props
    const {
      arbitrationCost,
      sharedStakeMultiplier,
      MULTIPLIER_DIVISOR,
    } = arbitrableTokenListData.data

    const value = arbitrationCost.add(
      arbitrationCost.mul(sharedStakeMultiplier).div(MULTIPLIER_DIVISOR)
    )

    fundDispute({
      ID: token.data.ID,
      value,
      side: tcrConstants.SIDE.Requester,
    })
  }

  handleFundChallengerClick = () => {
    const { fundDispute, token, arbitrableTokenListData } = this.props
    const { latestRequest } = token.data
    const { latestRound } = latestRequest
    const { arbitrationCost } = arbitrableTokenListData.data

    const value = latestRound.requiredFeeStake.add(arbitrationCost)

    fundDispute({
      ID: token.data.ID,
      value,
      side: tcrConstants.SIDE.Challenger,
    })
  }

  handleFundChallengerBadgeClick = () => {
    const { fundBadgeDispute, token, arbitrableTokenListData } = this.props
    const { badge } = token.data
    const { latestRequest } = badge.data
    const { latestRound } = latestRequest
    const { arbitrationCost } = arbitrableTokenListData.data

    const value = latestRound.requiredFeeStake.add(arbitrationCost)

    fundBadgeDispute({
      address: token.data.address,
      ID: token.data.ID,
      value,
      side: tcrConstants.SIDE.Challenger,
    })
  }

  handleFundAppealClick = ({ amount }) => {
    const { fundAppeal, token, actionModalParam } = this.props
    const tokenData = token.data
    const SIDE = actionModalParam
    const value = web3Utils.toWei(amount)

    fundAppeal(tokenData.ID, SIDE, value)
  }

  handleFundAppealBadgeClick = ({ amount }) => {
    const {
      fundBadgeAppeal,
      badge,
      actionModalParam: { side, badgeContractAddr },
    } = this.props
    const value = web3Utils.toWei(amount)

    fundBadgeAppeal({
      tokenAddr: badge.data.tokenAddress,
      badgeContractAddr,
      side,
      value,
    })
  }

  handleSubmitBadgeClick = (badgeContractAddr, tokenAddr) => {
    const { createBadge, badgeContracts } = this.props
    const arbitrableAddressListData = badgeContracts[badgeContractAddr]

    const {
      arbitrationCost,
      sharedStakeMultiplier,
      requesterBaseDeposit,
      MULTIPLIER_DIVISOR,
    } = arbitrableAddressListData

    const value = requesterBaseDeposit
      .add(arbitrationCost)
      .add(arbitrationCost.mul(sharedStakeMultiplier).div(MULTIPLIER_DIVISOR))

    this.setState({ file: null, fileInfoMessage: null })
    createBadge({ badgeContractAddr, tokenAddr, value })
  }

  handleCloseTokenSubmission = () => {
    const { closeActionModal } = this.props
    this.setState({ file: null, fileInfoMessage: null })
    closeActionModal()
  }

  handleRequestClose = () => {
    const { closeActionModal } = this.props
    this.setState({ file: null, fileInfoMessage: null })
    closeActionModal()
  }

  componentDidMount() {
    const {
      fetchArbitrableTokenListData,
      fetchArbitrableAddressListData,
    } = this.props
    fetchArbitrableTokenListData()
    fetchArbitrableAddressListData()
    instantiateEnvObjects().then((envObjects) => this.setState({ envObjects }))
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
      badgeContracts,
      submitTokenForm,
      submitEvidenceForm,
      tokenFormIsInvalid,
      evidenceFormIsInvalid,
      token,
      badge,
      actionModalParam,
    } = this.props

    const { envObjects } = this.state

    if (!envObjects) return null

    const { fileInfoMessage, file } = this.state

    if (token.creating || token.updating || badge.creating || badge.updating)
      return (
        <Modal className="ActionModal" isOpen={openActionModal !== null}>
          <div>
            <small>
              <h4>Transaction pending...</h4>
            </small>
            <BeatLoader color="#3d464d" />
          </div>
        </Modal>
      )

    let arbitrableAddressListData
    if (actionModalParam)
      arbitrableAddressListData =
        badgeContracts[actionModalParam.badgeContractAddr]

    /* eslint-disable react/jsx-no-bind */
    const {
      T2CR_SUBGRAPH_URL,
      arbitrableTCRView,
      ARBITRABLE_TOKEN_LIST_ADDRESS,
    } = envObjects

    switch (openActionModal) {
      case modalConstants.ACTION_MODAL_ENUM.Submit:
      case modalConstants.ACTION_MODAL_ENUM.Resubmit:
        return (
          <Modal
            className={
              openActionModal === modalConstants.ACTION_MODAL_ENUM.AddBadge
                ? 'Modal-add-badge'
                : ''
            }
            isOpen={openActionModal !== null}
            onRequestClose={this.handleRequestClose}
          >
            <Submit
              arbitrableTCRView={arbitrableTCRView}
              T2CR_SUBGRAPH_URL={T2CR_SUBGRAPH_URL}
              ARBITRABLE_TOKEN_LIST_ADDRESS={ARBITRABLE_TOKEN_LIST_ADDRESS}
              form={submitTokenForm}
              submitItem={this.handleSubmitTokenClick}
              submitItemForm={submitTokenForm}
              file={file}
              formIsInvalid={tokenFormIsInvalid}
              fileInfoMessage={fileInfoMessage}
              handleOnFileDropAccepted={this.handleOnImageDropAccepted}
              closeActionModal={this.handleCloseTokenSubmission}
              item={
                openActionModal === modalConstants.ACTION_MODAL_ENUM.Submit
                  ? null
                  : token
              }
              resubmit={this.handleResubmitTokenClick}
            />
          </Modal>
        )
      default:
        break
    }

    if (!arbitrableTokenListData.data)
      switch (openActionModal) {
        case modalConstants.ACTION_MODAL_ENUM.Submit:
        case modalConstants.ACTION_MODAL_ENUM.Resubmit:
        case modalConstants.ACTION_MODAL_ENUM.Clear:
        case modalConstants.ACTION_MODAL_ENUM.Challenge:
        case modalConstants.ACTION_MODAL_ENUM.FundRequester:
        case modalConstants.ACTION_MODAL_ENUM.FundChallenger:
        case modalConstants.ACTION_MODAL_ENUM.FundAppeal: {
          return (
            <Modal
              className="ActionModal"
              isOpen={openActionModal !== null}
              onRequestClose={this.handleRequestClose}
            >
              <div>
                <small>
                  <h4>Fetching TCR data</h4>
                </small>
                <BeatLoader color="#3d464d" />
              </div>
            </Modal>
          )
        }
        default:
          break
      }

    return (
      <Modal
        className={
          openActionModal === modalConstants.ACTION_MODAL_ENUM.AddBadge
            ? 'Modal-add-badge'
            : ''
        }
        isOpen={openActionModal !== null}
        onRequestClose={this.handleRequestClose}
      >
        {(() => {
          switch (openActionModal) {
            case modalConstants.ACTION_MODAL_ENUM.Clear:
              return (
                <Clear
                  tcrData={arbitrableTokenListData.data}
                  item={token.data}
                  clearItem={() => this.handleClearTokenClick(actionModalParam)}
                  closeActionModal={closeActionModal}
                />
              )
            case modalConstants.ACTION_MODAL_ENUM.Challenge:
              return (
                <Challenge
                  tcrData={arbitrableTokenListData.data}
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
            case modalConstants.ACTION_MODAL_ENUM.AddBadge:
              return (
                <AddBadge
                  arbitrableAddressListData={arbitrableAddressListData}
                  submitItem={this.handleSubmitBadgeClick}
                  closeActionModal={closeActionModal}
                  tokenAddr={token.data.address}
                  unavailable={actionModalParam}
                />
              )
            case modalConstants.ACTION_MODAL_ENUM.SubmitBadge:
            case modalConstants.ACTION_MODAL_ENUM.ResubmitBadge:
              return (
                <SubmitBadge
                  arbitrableAddressListData={arbitrableAddressListData}
                  submitItem={this.handleSubmitBadgeClick}
                  closeActionModal={closeActionModal}
                  tokenAddr={badge.data.tokenAddress}
                  badgeContractAddr={actionModalParam.badgeContractAddr}
                />
              )
            case modalConstants.ACTION_MODAL_ENUM.ClearBadge:
              return (
                <Clear
                  tcrData={arbitrableAddressListData}
                  closeActionModal={closeActionModal}
                  clearItem={() => this.handleClearBadgeClick(actionModalParam)}
                  item={badge}
                  badge
                />
              )
            case modalConstants.ACTION_MODAL_ENUM.ChallengeBadge:
              return (
                <Challenge
                  tcrData={arbitrableAddressListData}
                  closeActionModal={closeActionModal}
                  item={badge}
                  fundDispute={this.handleChallengeBadgeClick}
                  badgeContractAddr={actionModalParam}
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
                  tcr={{ data: arbitrableAddressListData }}
                  closeActionModal={closeActionModal}
                  item={badge.data}
                  fundAppeal={this.handleFundAppealBadgeClick}
                  side={actionModalParam.side}
                />
              )
            }
            case modalConstants.ACTION_MODAL_ENUM.SubmitEvidenceBadge:
              return (
                <SubmitEvidence
                  tcr={arbitrableAddressListData}
                  closeActionModal={closeActionModal}
                  item={badge}
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
              return <div className="ActionModal" />
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
  (state) => ({
    openActionModal: state.modal.openActionModal,
    tokenFormIsInvalid: getTokenFormIsInvalid(state),
    evidenceFormIsInvalid: getEvidenceFormIsInvalid(state),
    arbitrableTokenListData: state.arbitrableTokenList.arbitrableTokenListData,
    badgeContracts: state.arbitrableAddressList.arbitrableAddressListData.data,
    token: state.token.token,
    accounts: state.wallet.accounts,
    actionModalParam: state.modal.actionModalParam,
    badge: state.badge.badge,
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
    fundBadgeAppeal: badgeActions.fundAppeal,
  }
)(ActionModal)
