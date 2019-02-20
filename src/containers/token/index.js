import React, { PureComponent } from 'react'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import Img from 'react-image'
import * as mime from 'mime-types'
import { ClimbingBoxLoader } from 'react-spinners'

import {
  arbitrableTokenList,
  arbitrableAddressList,
  arbitrator,
  web3,
  archon
} from '../../bootstrap/dapp-api'
import EtherScanLogo from '../../assets/images/etherscan.png'
import Button from '../../components/button'
import BadgeCard from '../../components/badge-card'
import FilterBar from '../filter-bar'
import { hasPendingRequest, getBlock } from '../../utils/tcr'
import { truncateMiddle, getRemainingTime, getBadgeStyle } from '../../utils/ui'
import { getFileIcon } from '../../utils/evidence'
import getActionButton from '../../components/action-button'
import * as filterActions from '../../actions/filter'
import * as filterSelectors from '../../reducers/filter'
import * as tokenActions from '../../actions/token'
import * as modalActions from '../../actions/modal'
import * as modalConstants from '../../constants/modal'
import * as tcrConstants from '../../constants/tcr'
import * as walletSelectors from '../../reducers/wallet'
import * as arbitrableTokenListSelectors from '../../reducers/arbitrable-token-list'

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
      addr: PropTypes.string,
      URI: PropTypes.string
    }),
    match: PropTypes.shape({
      params: PropTypes.shape({
        tokenID: PropTypes.string
      })
    }),

    // Functions
    timeout: PropTypes.func.isRequired,
    fetchToken: PropTypes.func.isRequired,
    openActionModal: PropTypes.func.isRequired,
    toggleFilter: PropTypes.func.isRequired,
    withdrawTokenFunds: PropTypes.func.isRequired
  }

  static defaultProps = {
    match: {},
    token: null
  }

  state = {
    timestamp: null,
    countdown: null,
    listeningForEvidence: false,
    evidences: []
  }

  interval = null

  handleFilterChange = key => {
    const { toggleFilter } = this.props
    toggleFilter(key)
  }

  handleActionClick = (action, side) => {
    const { openActionModal } = this.props
    openActionModal(action, side)
  }

  handleExecuteRequestClick = () => {
    const { match, timeout, openActionModal } = this.props
    const { tokenID } = match.params
    openActionModal(modalConstants.ACTION_MODAL_ENUM.Timeout)
    timeout(tokenID)
  }

  handleFeesTimeoutClick = () => {
    const { timeout, token, openActionModal } = this.props
    openActionModal(modalConstants.ACTION_MODAL_ENUM.Timeout)
    timeout(token)
  }

  handleOpenEvidenceModal = () => {
    const { openActionModal } = this.props
    openActionModal(modalConstants.ACTION_MODAL_ENUM.SubmitEvidence)
  }

  handleViewEvidenceClick = evidence => () => {
    const { openActionModal } = this.props
    openActionModal(modalConstants.ACTION_MODAL_ENUM.ViewEvidence, evidence)
  }

  toSentenceCase = input => {
    input = input ? input.toLowerCase() : ''
    return input.charAt(0).toUpperCase() + input.slice(1)
  }

  componentDidMount() {
    const { match, fetchToken } = this.props
    const { tokenID } = match.params
    fetchToken(tokenID)
    arbitrableTokenList.events.Ruling().on('data', event => {
      const { token } = this.state
      const { latestRequest } = token
      if (
        latestRequest.disputed &&
        (latestRequest.disputeID === Number(event.returnValues._disputeID) ||
          latestRequest.appealDisputeID ===
            Number(event.returnValues._disputeID))
      ) {
        clearInterval(this.interval)
        this.setState({ countdown: null })
        fetchToken(tokenID)
      }
    })
    arbitrableTokenList.events.TokenStatusChange().on('data', event => {
      const { token } = this.state
      if (!token) return

      if (tokenID === event.returnValues._tokenID) {
        clearInterval(this.interval)
        this.setState({ countdown: null })
        fetchToken(tokenID)
      }
    })
    arbitrator.events.AppealPossible().on('data', event => {
      const { token } = this.state
      if (!token) return

      const { latestRequest } = token
      if (
        latestRequest.disputed &&
        (latestRequest.disputeID === Number(event.returnValues._disputeID) ||
          latestRequest.appealDisputeID ===
            Number(event.returnValues._disputeID))
      ) {
        clearInterval(this.interval)
        this.setState({ countdown: null })
        fetchToken(tokenID)
      }
    })
    arbitrableAddressList.events.AddressStatusChange().on('data', event => {
      const { token } = this.state
      if (!token) return

      if (token.addr === event.returnValues._address) {
        clearInterval(this.interval)
        this.setState({ countdown: null })
        fetchToken(tokenID)
      }
    })
    arbitrableTokenList.events.TokenStatusChange().on('data', event => {
      const { token } = this.state
      if (!token) return

      if (tokenID === event.returnValues._tokenID) {
        clearInterval(this.interval)
        this.setState({ countdown: null })
        fetchToken(tokenID)
      }
    })
    arbitrableTokenList.events
      .Evidence({ fromBlock: 0 })
      .on('data', async e => {
        const { token } = this.state
        if (!token) return
        const { latestRequest } = token

        if (latestRequest.evidenceGroupID !== e.returnValues._evidenceGroupID)
          return

        archon.arbitrable
          .getEvidence(
            arbitrableTokenList._address,
            arbitrator._address,
            latestRequest.evidenceGroupID
          )
          .then(resp =>
            resp
              .filter(
                evidence =>
                  evidence.evidenceJSONValid &&
                  (evidence.evidenceJSON.fileURI.length === 0 ||
                    evidence.fileValid)
              )
              .forEach(evidence => {
                const { evidences } = this.state
                const { evidenceJSON } = evidence
                const mimeType = mime.lookup(evidenceJSON.fileTypeExtension)
                evidenceJSON.icon = getFileIcon(mimeType)
                this.setState({
                  evidences: {
                    ...evidences,
                    [evidence.transactionHash]: evidenceJSON
                  }
                })
              })
          )
      })

    arbitrableTokenList.events
      .WaitingOpponent({ fromBlock: 0 })
      .on('data', async e => {
        const { token } = this.state
        if (!token) return

        if (e.returnValues._tokenID === tokenID) {
          clearInterval(this.interval)
          this.setState({ countdown: null })
          fetchToken(tokenID)
        }
      })
  }

  initCountDown = async () => {
    const { token, arbitrableTokenListData, accounts } = this.props
    const { countdown, listeningForEvidence } = this.state
    if (token) this.setState({ token })

    if (
      token &&
      hasPendingRequest(token) &&
      countdown === null &&
      arbitrableTokenListData &&
      arbitrableTokenListData.data &&
      arbitrator &&
      arbitrableTokenList
    ) {
      this.setState({ countdown: 'Loading...' })
      const { latestRequest } = token

      if (!listeningForEvidence && latestRequest.disputed) {
        // Listen for evidence events.
        this.setState({ listeningForEvidence: true })
        archon.arbitrable
          .getEvidence(
            arbitrableTokenList._address,
            arbitrator._address,
            latestRequest.disputeID
          )
          .then(resp =>
            resp
              .filter(
                evidence => evidence.evidenceJSONValid && evidence.fileValid
              )
              .forEach(evidence => {
                const { evidences } = this.state
                const { evidenceJSON } = evidence
                const mimeType = mime.lookup(evidenceJSON.fileTypeExtension)
                evidenceJSON.icon = getFileIcon(mimeType)
                this.setState({
                  evidences: {
                    ...evidences,
                    [evidence.transactionHash]: evidenceJSON
                  }
                })
              })
          )
      }

      let losingSide
      const userAccount = accounts.data[0]
      if (
        latestRequest.dispute &&
        Number(latestRequest.dispute.status) ===
          tcrConstants.DISPUTE_STATUS.Appealable &&
        !latestRequest.latestRound.appealed
      )
        if (
          userAccount === latestRequest.parties[tcrConstants.SIDE.Requester] &&
          latestRequest.dispute.ruling ===
            tcrConstants.RULING_OPTIONS.Refuse.toString()
        )
          losingSide = true
        else if (
          userAccount === latestRequest.parties[tcrConstants.SIDE.Challenger] &&
          latestRequest.dispute.ruling ===
            tcrConstants.RULING_OPTIONS.Accept.toString()
        )
          losingSide = true

      // Set timer once we have data.
      getBlock(null, web3, 'latest', block => {
        const time = getRemainingTime(
          token,
          arbitrableTokenListData,
          block.timestamp * 1000,
          tcrConstants,
          losingSide
        )
        if (time < 94608000) {
          // Very large duration for testing cases where the arbitrator doesn't have an appeal period
          this.setState({
            timestamp: block.timestamp,
            countdown: new Date(time)
          })
          clearInterval(this.interval)
          this.interval = setInterval(() => {
            const { countdown } = this.state
            if (countdown > 0)
              this.setState({ countdown: new Date(countdown - 1000) })
          }, 1000)
        }
      })
    }
  }

  withdrawFunds = async () => {
    const { withdrawTokenFunds, token } = this.props
    withdrawTokenFunds({ ID: token.ID, request: token.numberOfRequests - 1 })
  }

  componentDidUpdate() {
    this.initCountDown()
  }

  submitBadgeAction = () =>
    this.handleActionClick(modalConstants.ACTION_MODAL_ENUM.SubmitBadge)

  componentWillUnmount() {
    clearInterval(this.interval)
  }

  componentWillReceiveProps(nextProps) {
    const { token } = nextProps
    if (!token) return
    else this.setState({ token })
    this.initCountDown()
  }

  render() {
    const { countdown, evidences, timestamp } = this.state
    const {
      token,
      accounts,
      filter,
      match,
      arbitrableTokenListData
    } = this.props
    const { filters } = filter
    const { tokenID } = match.params

    if (!token)
      return (
        <div className="Page Page--loading">
          <ClimbingBoxLoader color="#3d464d" />
        </div>
      )

    if (token.ID !== tokenID) return window.location.reload()

    return (
      <div className="Page">
        <FilterBar
          filter={filters}
          handleFilterChange={this.handleFilterChange}
        />
        <div style={{ display: 'flex', flexDirection: 'row' }}>
          <h4>Token Details</h4>
          {token.latestRequest.withdrawable > 0 && (
            <>
              <div className="TokenDetails-divider" />
              <h5
                className="TokenDetails-withdraw"
                onClick={this.withdrawFunds}
              >
                <span className="TokenDetails-withdraw-value">
                  {web3.utils.fromWei(
                    token.latestRequest.withdrawable.toString()
                  )}{' '}
                  ETH{' '}
                </span>
                Withdraw Funds
              </h5>
            </>
          )}
        </div>
        <hr className="TokenDescription-separator" />
        <div className="TokenDetails">
          <Img
            className="TokenDetails-img"
            src={`https://staging-cfs.s3.us-east-2.amazonaws.com/${
              token.symbolMultihash
            }`}
          />
          <div className="TokenDetails-card">
            <div className="TokenDetails-label">
              <span className="TokenDetails-label-name">{token.name}</span>
              <span className="TokenDetails-label-ticker">{token.ticker}</span>
            </div>
            <div className="TokenDetails-divider" />
            <div className="TokenDetails-meta">
              <div className="TokenDetails-meta--aligned">
                <span>
                  <a
                    className="TokenDetails--link"
                    href={`https://etherscan.io/token/${token.addr}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Img
                      className="TokenDetails-icon TokenDetails-meta--aligned"
                      src={EtherScanLogo}
                    />
                    {truncateMiddle(token.addr)}
                  </a>
                </span>
              </div>
              {(token.badge.status ===
                tcrConstants.IN_CONTRACT_STATUS_ENUM['Registered'] ||
                token.badge.status ===
                  tcrConstants.IN_CONTRACT_STATUS_ENUM['ClearingRequested'] ||
                token.badge.status ===
                  tcrConstants.IN_CONTRACT_STATUS_ENUM[
                    'RegistrationRequested'
                  ]) &&
                token.status !==
                  tcrConstants.IN_CONTRACT_STATUS_ENUM['Absent'] &&
                token.badge && (
                  <div>
                    <span>
                      <span
                        className="TokenDetails-icon-badge TokenDetails-meta--aligned"
                        style={getBadgeStyle(token.badge, tcrConstants)}
                      >
                        1
                      </span>
                      Badge
                    </span>
                  </div>
                )}
            </div>
            <div className="TokenDetails-meta">
              <span className="TokenDetails-meta--aligned">
                <FontAwesomeIcon
                  className="TokenDetails-icon"
                  color={tcrConstants.STATUS_COLOR_ENUM[token.clientStatus]}
                  icon={tcrConstants.STATUS_ICON_ENUM[token.clientStatus]}
                />
                {this.toSentenceCase(
                  tcrConstants.STATUS_ENUM[token.clientStatus]
                )}
              </span>
              {token.latestRequest.dispute &&
                Number(token.latestRequest.dispute.status) ===
                  tcrConstants.DISPUTE_STATUS.Appealable &&
                !token.latestRequest.latestRound.appealed && (
                  <span
                    className="BadgeDetails-timer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      color: '#3d464d'
                    }}
                  >
                    <FontAwesomeIcon
                      className="TokenDetails-icon"
                      color={tcrConstants.STATUS_COLOR_ENUM[5]}
                      icon="balance-scale"
                      style={{ marginRight: '10px' }}
                    />
                    Arbitration Result:{' '}
                    {
                      tcrConstants.RULING_OPTIONS[
                        token.latestRequest.dispute.status
                      ]
                    }{' '}
                    Request
                  </span>
                )}
              {!(
                token.clientStatus <= 1 ||
                (hasPendingRequest(token.status, token.latestRequest) &&
                  token.latestRequest.dispute &&
                  token.latestRequest.dispute.status !==
                    tcrConstants.DISPUTE_STATUS.Appealable.toString()) ||
                Number(countdown) === 0
              ) && (
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  {!token.latestRequest.dispute && (
                    <>
                      <FontAwesomeIcon
                        className="TokenDetails-icon"
                        color={tcrConstants.STATUS_COLOR_ENUM[4]}
                        icon="clock"
                      />
                      <div className="BadgeDetails-timer">
                        {`${
                          token.latestRequest.dispute &&
                          token.latestRequest.dispute.status !==
                            tcrConstants.DISPUTE_STATUS.Appealable.toString()
                            ? 'Appeal'
                            : 'Challenge'
                        } Deadline ${
                          countdown instanceof Date
                            ? countdown.toISOString().substr(11, 8)
                            : '--:--:--'
                        }`}
                      </div>
                    </>
                  )}
                </span>
              )}
            </div>
            <div className="TokenDetails-action">
              {getActionButton({
                item: token,
                userAccount: accounts.data[0],
                tcr: arbitrableTokenListData,
                timestamp,
                countdown,
                handleActionClick: this.handleActionClick,
                handleExecuteRequestClick: this.handleExecuteRequestClick
              })}
            </div>
          </div>
        </div>
        {token.latestRequest && !token.latestRequest.resolved && (
          <div className="TokenDescription">
            <hr className="TokenDescription-separator" />
            <h3>Evidence</h3>
            <div className="TokenDescription-evidence">
              <div className="TokenDescription-evidence--list">
                {Object.keys(evidences).map(key => (
                  <div
                    className="TokenDescription-evidence--item"
                    key={key}
                    onClick={this.handleViewEvidenceClick(evidences[key])}
                  >
                    <FontAwesomeIcon icon={evidences[key].icon} size="2x" />
                  </div>
                ))}
              </div>
              <Button onClick={this.handleOpenEvidenceModal} type="secondary">
                Submit Evidence
              </Button>
            </div>
          </div>
        )}
        <br />
        <div className="TokenDescription">
          <hr className="TokenDescription-separator" />
          <div className="TokenDescription-badge-header">
            <h3>Badges</h3>
            {(token.status ===
              tcrConstants.IN_CONTRACT_STATUS_ENUM['Registered'] ||
              token.status ===
                tcrConstants.IN_CONTRACT_STATUS_ENUM['ClearingRequested']) &&
              token.badge.status ===
                tcrConstants.IN_CONTRACT_STATUS_ENUM['Absent'] && (
                <Button
                  onClick={this.submitBadgeAction}
                  type="secondary"
                  style={{ width: '135px' }}
                >
                  Add Badge
                </Button>
              )}
            {token.status !==
              tcrConstants.IN_CONTRACT_STATUS_ENUM['Registered'] &&
              token.status !==
                tcrConstants.IN_CONTRACT_STATUS_ENUM['ClearingRequested'] &&
              token.badge.status ===
                tcrConstants.IN_CONTRACT_STATUS_ENUM['Absent'] && (
                <span>Token must be registered to add badges.</span>
              )}
          </div>
          <div className="TokenDescription-evidence">
            {token.badge.status !==
              tcrConstants.IN_CONTRACT_STATUS_ENUM['Absent'] &&
              token.status !==
                tcrConstants.IN_CONTRACT_STATUS_ENUM['Absent'] && (
                <BadgeCard token={token} />
              )}
          </div>
        </div>
      </div>
    )
  }
}

export default connect(
  state => ({
    token: state.token.token.data,
    accounts: state.wallet.accounts,
    arbitrableTokenListData: state.arbitrableTokenList.arbitrableTokenListData,
    filter: state.filter
  }),
  {
    fetchToken: tokenActions.fetchToken,
    withdrawTokenFunds: tokenActions.withdrawTokenFunds,
    timeout: tokenActions.timeout,
    openActionModal: modalActions.openActionModal,
    feesTimeout: tokenActions.feesTimeout,
    toggleFilter: filterActions.toggleFilter
  }
)(TokenDetails)
