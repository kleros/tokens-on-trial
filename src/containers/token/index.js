import React, { PureComponent } from 'react'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import { BeatLoader } from 'react-spinners'
import { onlyInfura } from '../../bootstrap/dapp-api'
import Button from '../../components/button'
import Modal from '../../components/modal'
import FilterBar from '../filter-bar'
import WithdrawFundsButton from '../../components/withdraw-funds'
import { getRemainingTime } from '../../utils/ui'
import * as filterActions from '../../actions/filter'
import * as filterSelectors from '../../reducers/filter'
import * as tokenActions from '../../actions/token'
import * as tokensActions from '../../actions/tokens'
import * as modalActions from '../../actions/modal'
import * as modalConstants from '../../constants/modal'
import * as tcrConstants from '../../constants/tcr'
import * as walletSelectors from '../../reducers/wallet'
import * as arbitrableTokenListSelectors from '../../reducers/arbitrable-token-list'
import { ContractsContext } from '../../bootstrap/contexts'
import Evidence from '../evidence'
import CrowdfundingCard from '../crowdfunding-card'
import PageNotFound from '../../components/page-not-found'
import Badges from './badges'
import TokenDetailsCard from './token-details-card'
import './token.css'

class TokenDetails extends PureComponent {
  static propTypes = {
    // State
    filter: filterSelectors.filterShape.isRequired,
    accounts: walletSelectors.accountsShape.isRequired,
    arbitrableTokenListData:
      arbitrableTokenListSelectors.arbitrableTokenListDataShape.isRequired,
    token: PropTypes.shape({
      name: PropTypes.string,
      ticker: PropTypes.string,
      address: PropTypes.string,
      URI: PropTypes.string,
    }),
    match: PropTypes.shape({
      params: PropTypes.shape({
        tokenID: PropTypes.string,
      }),
    }),
    envObjects: PropTypes.shape({}).isRequired,

    // Functions
    timeout: PropTypes.func.isRequired,
    fetchToken: PropTypes.func.isRequired,
    openActionModal: PropTypes.func.isRequired,
    toggleFilter: PropTypes.func.isRequired,
    withdrawTokenFunds: PropTypes.func.isRequired,
    fetchTokens: PropTypes.func.isRequired,
  }

  static contextType = ContractsContext

  static defaultProps = {
    match: {},
    token: null,
  }

  state = {
    countdownCompleted: false,
    appealModalOpen: false,
    loserCountdownCompleted: false,
    winnerCountdownCompleted: false,
    eventListenerSet: false,
    evidencePeriodEnded: false,
  }

  handleFilterChange = (key) => {
    const { toggleFilter } = this.props
    const { arbitrableTokenListView } = this.context
    toggleFilter(key, arbitrableTokenListView)
  }

  handleActionClick = (action, side) => {
    const { openActionModal } = this.props
    openActionModal(action, side)
  }

  handleExecuteRequestClick = () => {
    const { match, timeout, openActionModal } = this.props
    const { tokenID } = match.params
    openActionModal(modalConstants.ACTION_MODAL_ENUM.TxPending)
    timeout(tokenID)
  }

  handleFeesTimeoutClick = () => {
    const { timeout, token, openActionModal } = this.props
    openActionModal(modalConstants.ACTION_MODAL_ENUM.TxPending)
    timeout(token)
  }

  handleOpenEvidenceModal = () => {
    const { openActionModal } = this.props
    openActionModal(modalConstants.ACTION_MODAL_ENUM.SubmitEvidence)
  }

  handleViewEvidenceClick = (evidence) => () => {
    const { openActionModal } = this.props
    openActionModal(modalConstants.ACTION_MODAL_ENUM.ViewEvidence, evidence)
  }

  toSentenceCase = (input) => {
    input = input ? input.toLowerCase() : ''
    return input.charAt(0).toUpperCase() + input.slice(1)
  }

  withdrawFunds = () => {
    const { withdrawTokenFunds, token, openActionModal } = this.props
    openActionModal(modalConstants.ACTION_MODAL_ENUM.TxPending)
    withdrawTokenFunds({ ID: token.ID, item: token })
  }

  fundAppeal = () => {
    this.setState({ appealModalOpen: true })
  }

  onCountdownComplete = (time) => {
    if (typeof time === 'number' && time > 0) return
    this.setState({ countdownCompleted: true })
  }

  onWinnerCountdownComplete = (time) => {
    if (typeof time === 'number' && time > 0) return
    this.setState({ winnerCountdownCompleted: true })
  }

  onLoserCountdownComplete = (time) => {
    if (typeof time === 'number' && time > 0) return
    this.setState({ loserCountdownCompleted: true })
  }

  onEvidenceCountdownComplete = (time) => {
    if (typeof time === 'number' && time > 0) return
    this.setState({ evidencePeriodEnded: true })
  }

  componentDidMount() {
    const { match, fetchToken, fetchTokens } = this.props
    const { tokenID } = match.params
    this.setState({ fetching: true })
    fetchToken(tokenID)
    fetchTokens()
  }

  componentWillReceiveProps(nextProps) {
    const { token: nextToken } = nextProps
    const { match, fetchToken } = this.props
    const { fetching } = this.state
    const { tokenID } = match.params
    if (nextToken && nextToken.ID === tokenID)
      this.setState({ token: nextToken, fetching: false })
    else if (!fetching) {
      this.setState({ fetching: true })
      fetchToken(tokenID)
    }
  }

  async setupListeners({
    arbitrableTokenListEvents,
    fetchToken,
    tokenID,
    accounts,
    arbitratorEvents,
  }) {
    arbitrableTokenListEvents.events.Ruling((err, event) => {
      if (err) {
        console.error(err)
        return
      }
      const { token } = this.state
      if (!token) return
      const { latestRequest } = token
      if (
        latestRequest.disputed &&
        (latestRequest.disputeID === Number(event.returnValues._disputeID) ||
          latestRequest.appealDisputeID ===
            Number(event.returnValues._disputeID))
      )
        fetchToken(tokenID)
    })
    arbitrableTokenListEvents.events.RewardWithdrawal((err, event) => {
      if (err) {
        console.error(err)
        return
      }
      const { token } = this.state
      if (
        !token ||
        event.returnValues._beneficiary !== accounts.data[0] ||
        token.ID !== event.returnValues._tokenID
      )
        return
      fetchToken(event.returnValues._tokenID)
    })
    arbitrableTokenListEvents.events.TokenStatusChange((err, event) => {
      if (err) {
        console.error(err)
        return
      }
      const { token } = this.state
      if (!token) return

      if (tokenID === event.returnValues._tokenID) fetchToken(tokenID)
    })
    arbitratorEvents.events.AppealPossible((err, event) => {
      if (err) {
        console.error(err)
        return
      }
      const { token } = this.state
      if (!token) return

      const { latestRequest } = token
      if (
        latestRequest.disputed &&
        (latestRequest.disputeID === Number(event.returnValues._disputeID) ||
          latestRequest.appealDisputeID ===
            Number(event.returnValues._disputeID))
      )
        fetchToken(tokenID)
    })
    arbitrableTokenListEvents.events.TokenStatusChange((err, event) => {
      if (err) {
        console.error(err)
        return
      }
      const { token } = this.state
      if (!token) return
      if (tokenID === event.returnValues._tokenID) fetchToken(tokenID)
    })
  }

  async componentDidUpdate() {
    if (!this.context) return
    const { arbitrableTokenListView } = this.context
    if (!arbitrableTokenListView) return
    const { match, fetchToken, accounts } = this.props
    const {
      T2CR_BLOCK,
      arbitrableTokenListEvents,
      arbitratorEvents,
      archon,
    } = this.context

    const { token, fetching, eventListenerSet } = this.state
    const { tokenID } = match.params
    if (!fetching && token && eventListenerSet && token.ID !== tokenID) {
      fetchToken(tokenID)
      this.setState({
        fetching: true,
        eventListenerSet: false,
      })
      return
    }
    if (fetching || (token && eventListenerSet && token.ID === tokenID)) return

    if (!token && !fetching) {
      fetchToken(tokenID)
      return
    }

    if (!token && fetching) return
    if (token && token.ID !== tokenID && !fetching) window.location.reload(true)
    if (eventListenerSet) return

    const { latestRequest } = token

    if (token && !eventListenerSet)
      this.setState({ eventListenerSet: true }, () => {
        this.setupListeners({
          arbitrableTokenListEvents,
          fetchToken,
          tokenID,
          accounts,
          arbitratorEvents,
          archon,
          arbitrableTokenListView,
          latestRequest,
          T2CR_BLOCK,
        })
      })
  }

  render() {
    const { appealModalOpen, loserCountdownCompleted, token } = this.state

    if (!this.context) return null
    const { arbitrableTokenListView, arbitratorView } = this.context

    const {
      accounts,
      filter,
      match,
      arbitrableTokenListData,
      envObjects,
    } = this.props

    if (!envObjects) return null

    const { FILE_BASE_URL } = envObjects.data
    const { filters } = filter
    const { tokenID } = match.params

    if (!token || token.ID !== tokenID)
      return (
        <div className="Page Page--loading">
          <BeatLoader color="#3d464d" />
        </div>
      )

    if (token.numberOfRequests === 0)
      return (
        <PageNotFound
          type="404"
          title="Oops,"
          msg="Token Not Found"
          small="Are you in the correct network?"
        />
      )

    let decisiveRuling
    let requesterIsLoser
    let challengerIsLoser
    const { latestRequest } = token

    if (
      latestRequest.dispute &&
      Number(latestRequest.dispute.status) ===
        tcrConstants.DISPUTE_STATUS.Appealable &&
      !latestRequest.latestRound.appealed &&
      latestRequest.dispute.ruling !== tcrConstants.RULING_OPTIONS.None
    ) {
      decisiveRuling = true
      requesterIsLoser =
        latestRequest.dispute.ruling === tcrConstants.RULING_OPTIONS.Refuse
      challengerIsLoser =
        latestRequest.dispute.ruling === tcrConstants.RULING_OPTIONS.Accept
    }

    const loserRemainingTime = getRemainingTime(
      token,
      arbitrableTokenListData,
      tcrConstants,
      true,
      decisiveRuling
    )

    let latestRound
    let requesterFeesPercent = 0
    let challengerFeesPercent = 0
    let loserPercent = 0
    let loserTimedOut
    if (latestRequest) latestRound = latestRequest.latestRound
    if (
      latestRequest.dispute &&
      Number(latestRequest.dispute.status) ===
        tcrConstants.DISPUTE_STATUS.Appealable &&
      !latestRequest.latestRound.appealed
    ) {
      requesterFeesPercent = !latestRound.hasPaid[1]
        ? (Number(latestRound.paidFees[1]) /
            Number(latestRound.requiredForSide[1])) *
          100
        : 100

      challengerFeesPercent = !latestRound.hasPaid[2]
        ? (Number(latestRound.paidFees[2]) /
            Number(latestRound.requiredForSide[2])) *
          100
        : 100

      if (decisiveRuling) {
        loserPercent =
          latestRequest.dispute.ruling === tcrConstants.RULING_OPTIONS.Accept
            ? challengerFeesPercent
            : requesterFeesPercent

        if (loserPercent < 100 && loserCountdownCompleted) loserTimedOut = true
      }
    }

    /* eslint-disable react/jsx-no-bind */
    return (
      <div className="Page">
        <FilterBar
          filter={filters}
          handleFilterChange={this.handleFilterChange}
        />
        <div style={{ display: 'flex', flexDirection: 'row' }}>
          <h4 style={{ marginLeft: 0 }}>Token Details</h4>
          <WithdrawFundsButton
            onWithdrawFundsClick={this.withdrawFunds}
            item={token}
          />
        </div>
        <hr className="TokenDescription-separator" />
        <TokenDetailsCard
          token={token}
          FILE_BASE_URL={FILE_BASE_URL}
          userAccount={accounts.data[0]}
          arbitrableTokenListData={arbitrableTokenListData.data}
          handleActionClick={this.handleActionClick}
          handleExecuteRequestClick={this.handleExecuteRequestClick}
          fundAppeal={this.fundAppeal}
        />
        <CrowdfundingCard
          item={token}
          userAccount={accounts.data[0]}
          tcrData={arbitrableTokenListData.data}
          fundAppeal={this.fundAppeal}
          handleActionClick={this.handleActionClick}
        />
        <br />
        <Evidence
          itemID={tokenID}
          item={token}
          tcr={arbitrableTokenListView}
          tcrData={arbitrableTokenListData.data}
          arbitratorView={arbitratorView}
          handleOpenEvidenceModal={this.handleOpenEvidenceModal}
          handleViewEvidenceClick={this.handleViewEvidenceClick}
        />
        <Badges token={token} />
        {/* eslint-disable react/jsx-no-bind */}
        {(!decisiveRuling || !loserTimedOut) && (
          <Modal
            className="ActionModal"
            isOpen={appealModalOpen}
            onRequestClose={() => this.setState({ appealModalOpen: false })}
          >
            <h3 className="Modal-title">
              <FontAwesomeIcon className="Appeal-icon" icon="coins" />
              Contribute Fees
            </h3>
            <hr />
            <br />
            <h5 className="Modal-subtitle">Which side do you want to fund?</h5>
            {decisiveRuling &&
              (loserRemainingTime === 0 || loserCountdownCompleted) && (
                <small>
                  <h5 className="Modal-subtitle" style={{ marginTop: 0 }}>
                    Note: The appeal period for the loser has ended.
                  </h5>
                </small>
              )}
            <br />
            <div style={{ display: 'flex' }}>
              <Button
                className="Appeal-request"
                type="primary"
                style={{ marginLeft: 0, marginRight: '6px' }}
                tooltip={onlyInfura ? 'Please install MetaMask.' : null}
                disabled={
                  onlyInfura ||
                  (decisiveRuling &&
                    requesterIsLoser &&
                    (loserRemainingTime === 0 || loserCountdownCompleted))
                }
                onClick={() => {
                  this.setState({ appealModalOpen: false })
                  this.handleActionClick(
                    modalConstants.ACTION_MODAL_ENUM['FundAppeal'],
                    tcrConstants.SIDE.Requester
                  )
                }}
              >
                Fund Requester
              </Button>
              <Button
                className="Appeal-request"
                type="primary"
                style={{ marginLeft: '6px' }}
                tooltip={onlyInfura ? 'Please install MetaMask.' : null}
                disabled={
                  onlyInfura ||
                  (decisiveRuling &&
                    challengerIsLoser &&
                    (loserRemainingTime === 0 || loserCountdownCompleted))
                }
                onClick={() => {
                  this.setState({ appealModalOpen: false })
                  this.handleActionClick(
                    modalConstants.ACTION_MODAL_ENUM['FundAppeal'],
                    tcrConstants.SIDE.Challenger
                  )
                }}
              >
                Fund Challenger
              </Button>
            </div>
          </Modal>
        )}
      </div>
    )
  }
}

export default connect(
  (state) => ({
    token: state.token.token.data,
    accounts: state.wallet.accounts,
    arbitrableTokenListData: state.arbitrableTokenList.arbitrableTokenListData,
    filter: state.filter,
    envObjects: state.envObjects,
  }),
  {
    fetchToken: tokenActions.fetchToken,
    withdrawTokenFunds: tokenActions.withdrawTokenFunds,
    timeout: tokenActions.timeout,
    openActionModal: modalActions.openActionModal,
    feesTimeout: tokenActions.feesTimeout,
    toggleFilter: filterActions.toggleFilter,
    fetchTokens: tokensActions.fetchTokens,
  }
)(TokenDetails)
