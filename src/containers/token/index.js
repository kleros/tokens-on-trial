import React, { PureComponent } from 'react'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import Img from 'react-image'
import * as mime from 'mime-types'

import { arbitrableTokenList, arbitrator, web3 } from '../../bootstrap/dapp-api'
import EtherScanLogo from '../../assets/images/etherscan.png'
import Button from '../../components/button'
import BadgeCard from '../../components/badge-card'
import FilterBar from '../filter-bar'
import {
  hasPendingRequest,
  isRegistrationRequest,
  getBlock
} from '../../utils/tcr'
import { truncateMiddle, getRemainingTime, getBadgeStyle } from '../../utils/ui'
import { getFileIcon } from '../../utils/evidence'
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
    toggleFilter: PropTypes.func.isRequired
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
    const { match, timeout } = this.props
    const { tokenID } = match.params
    timeout(tokenID)
  }

  handleFeesTimeoutClick = () => {
    const { timeout, token } = this.props
    timeout(token)
  }

  handleOpenEvidenceModal = () => {
    const { openActionModal } = this.props
    openActionModal(modalConstants.ACTION_MODAL_ENUM.SubmitEvidenceBadge)
  }

  handleViewEvidenceClick = evidence => () => {
    const { openActionModal } = this.props
    openActionModal(modalConstants.ACTION_MODAL_ENUM.ViewEvidence, evidence)
  }

  toSentenceCase = input => {
    input = input.toLowerCase()
    return input.charAt(0).toUpperCase() + input.slice(1)
  }

  getActionButton = (token, userAccount) => {
    const { arbitrableTokenListData } = this.props
    const { timestamp, countdown } = this.state
    let method
    let disabled = true
    let label = 'Loading...'
    let icon = 'spinner'

    if (
      !token ||
      !arbitrableTokenListData.data ||
      token.creating ||
      token.updating
    )
      return (
        <Button disabled={disabled} type="primary">
          <FontAwesomeIcon className="TokenDetails-icon" icon={icon} />
          {label}
        </Button>
      )

    const challengePeriodDuration = Number(
      arbitrableTokenListData.data.challengePeriodDuration
    )
    const arbitrationFeesWaitingTime = Number(
      arbitrableTokenListData.data.arbitrationFeesWaitingTime
    )
    const { latestRequest } = token
    const { latestRound, challengerDepositTime } = latestRequest
    const submitterFees = latestRound.paidFees[tcrConstants.SIDE.Requester]
    const challengerFees = latestRound.paidFees[tcrConstants.SIDE.Challenger]

    if (hasPendingRequest(token))
      if (latestRequest.disputed && !latestRequest.resolved) {
        icon = 'hourglass-half'
        disabled = true
        label = 'Waiting Arbitration'
        if (
          Number(latestRequest.dispute.status) ===
            tcrConstants.DISPUTE_STATUS.Appealable &&
          !latestRound.appealed
        )
          if (
            userAccount ===
              token.latestRequest.parties[tcrConstants.SIDE.Requester] ||
            userAccount ===
              token.latestRequest.parties[tcrConstants.SIDE.Challenger]
          ) {
            const appealPeriodStart = Number(
              latestRequest.latestRound.appealPeriod[0]
            )
            const appealPeriodEnd = Number(
              latestRequest.latestRound.appealPeriod[1]
            )
            const appealPeriodDuration = appealPeriodEnd - appealPeriodStart
            const endOfFirstHalf = appealPeriodStart + appealPeriodDuration / 2
            if (timestamp < appealPeriodEnd) {
              const SIDE =
                userAccount ===
                token.latestRequest.parties[tcrConstants.SIDE.Requester]
                  ? tcrConstants.SIDE.Requester
                  : tcrConstants.SIDE.Challenger

              if (
                latestRound.requiredForSide[SIDE] === 0 ||
                latestRound.paidFees[SIDE] < latestRound.requiredForSide[SIDE]
              ) {
                let losingSide
                if (
                  userAccount ===
                    token.latestRequest.parties[tcrConstants.SIDE.Requester] &&
                  token.latestRequest.dispute.ruling ===
                    tcrConstants.RULING_OPTIONS.Refuse.toString()
                )
                  losingSide = true
                else if (
                  userAccount ===
                    token.latestRequest.parties[tcrConstants.SIDE.Challenger] &&
                  token.latestRequest.dispute.ruling ===
                    tcrConstants.RULING_OPTIONS.Accept.toString()
                )
                  losingSide = true

                if (!losingSide) {
                  label = 'Fund Appeal'
                  disabled = false
                  method = () =>
                    this.handleActionClick(
                      modalConstants.ACTION_MODAL_ENUM.FundAppeal,
                      SIDE
                    )
                } else if (timestamp < endOfFirstHalf) {
                  label = 'Fund Appeal'
                  disabled = false
                  method = () =>
                    this.handleActionClick(
                      modalConstants.ACTION_MODAL_ENUM.FundAppeal,
                      SIDE
                    )
                }
              } else label = 'Waiting For Opponent Fees'
            }
          } else if (countdown > 0) label = 'Wating Appeals'
      } else if (
        submitterFees > 0 &&
        challengerFees > 0 &&
        timestamp > challengerDepositTime + arbitrationFeesWaitingTime
      ) {
        icon = 'gavel'
        disabled = false
        method = this.handleExecuteRequestClick
        if (submitterFees > challengerFees) label = 'Timeout Challenger'
        else label = 'Timeout Submitter'
      } else if (
        timestamp >= latestRequest.submissionTime + challengePeriodDuration ||
        (countdown && countdown.getTime && countdown.getTime() === 0)
      ) {
        method = this.handleExecuteRequestClick
        icon = 'check'
        disabled = false
        label = 'Execute Request'
      } else if (
        challengerDepositTime > 0 &&
        timestamp - challengerDepositTime < arbitrationFeesWaitingTime &&
        (userAccount ===
          token.latestRequest.parties[tcrConstants.SIDE.Requester] ||
          userAccount ===
            token.latestRequest.parties[tcrConstants.SIDE.Challenger])
      ) {
        icon = 'gavel'
        label = 'Pay Arbitration Fees'
        disabled = false
        if (
          challengerFees > submitterFees &&
          userAccount ===
            token.latestRequest.parties[tcrConstants.SIDE.Requester]
        )
          method = () =>
            this.handleActionClick(
              modalConstants.ACTION_MODAL_ENUM.FundRequester
            )
        else if (
          submitterFees > challengerFees &&
          userAccount ===
            token.latestRequest.parties[tcrConstants.SIDE.Challenger]
        )
          method = () =>
            this.handleActionClick(
              modalConstants.ACTION_MODAL_ENUM.FundChallenger
            )
        else {
          icon = 'hourglass-half'
          label = 'Waiting Requester Fees'
          disabled = true
        }
      } else if (
        userAccount === latestRequest.parties[tcrConstants.SIDE.Requester]
      ) {
        icon = 'hourglass-half'
        disabled = true
        label = 'Waiting Challenges'
      } else {
        icon = 'gavel'
        disabled = false
        method = () =>
          this.handleActionClick(modalConstants.ACTION_MODAL_ENUM.Challenge)
        if (isRegistrationRequest(token.status))
          label = 'Challenge Registration'
        else label = 'Challenge Clearing'
      }
    else {
      disabled = false
      if (token.status === tcrConstants.IN_CONTRACT_STATUS_ENUM['Registered']) {
        method = () =>
          this.handleActionClick(modalConstants.ACTION_MODAL_ENUM.Clear)
        label = 'Submit Clearing Request'
        icon = 'times-circle'
      } else {
        label = 'Resubmit Token'
        icon = 'plus'
        method = () =>
          this.handleActionClick(modalConstants.ACTION_MODAL_ENUM.Resubmit)
      }
    }

    return (
      <Button disabled={disabled} onClick={method} type="primary">
        <FontAwesomeIcon className="TokenDetails-icon" icon={icon} />
        {label}
      </Button>
    )
  }

  componentDidMount() {
    const { match, fetchToken } = this.props
    const { tokenID } = match.params
    fetchToken(tokenID)
  }

  componentDidUpdate() {
    const { token, arbitrableTokenListData, accounts } = this.props
    const { countdown, listeningForEvidence } = this.state

    if (
      token &&
      hasPendingRequest(token) &&
      countdown === null &&
      arbitrableTokenListData &&
      arbitrableTokenListData.data
    ) {
      this.setState({ countdown: 'Loading...' })
      const { latestRequest } = token

      if (!listeningForEvidence && latestRequest.disputed) {
        // Listen for evidence events.
        this.setState({ listeningForEvidence: true })
        arbitrableTokenList.events
          .Evidence({
            filter: {
              arbitrator: arbitrator._address,
              disputeID: [latestRequest.disputeID]
            },
            fromBlock: 0
          })
          .on('data', async e => {
            const evidence = JSON.parse(
              await (await fetch(e.returnValues._evidence)).json()
            )

            if (Number(e.returnValues._disputeID) === latestRequest.disputeID) {
              evidence.icon = getFileIcon(
                mime.lookup(evidence.fileTypeExtension)
              )
              const { evidences } = this.state
              this.setState({
                evidences: [...evidences, evidence]
              })
            }
          })
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
        this.setState({
          timestamp: block.timestamp,
          countdown: new Date(time)
        })
        this.interval = setInterval(() => {
          const { countdown } = this.state
          if (countdown > 0)
            this.setState({ countdown: new Date(countdown - 1000) })
        }, 1000)
      })
    }
  }

  submitBadgeAction = () =>
    this.handleActionClick(modalConstants.ACTION_MODAL_ENUM.SubmitBadge)

  componentWillUnmount() {
    clearInterval(this.interval)
  }

  render() {
    const { countdown, evidences } = this.state
    const { token, accounts, filter, match } = this.props
    const { filters } = filter
    const { tokenID } = match.params

    if (!token)
      return (
        <div className="Page">
          <h5>Loading...</h5>
        </div>
      )

    if (token.ID !== tokenID) return window.location.reload()

    return (
      <div className="Page">
        <FilterBar
          filter={filters}
          handleFilterChange={this.handleFilterChange}
        />
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
                  <FontAwesomeIcon
                    className="TokenDetails-icon"
                    color={tcrConstants.STATUS_COLOR_ENUM[4]}
                    icon="clock"
                  />
                  <div className="BadgeDetails-timer">
                    {token.latestRequest.dispute &&
                    token.latestRequest.dispute.status ===
                      tcrConstants.DISPUTE_STATUS.Appealable.toString()
                      ? 'Appeal '
                      : 'Challenge '}
                    Deadline{' '}
                    {countdown instanceof Date
                      ? countdown.toISOString().substr(11, 8)
                      : '--:--:--'}
                  </div>
                </span>
              )}
            </div>
            <div className="TokenDetails-action">
              {this.getActionButton(token, accounts.data[0])}
            </div>
          </div>
        </div>
        {token.latestRequest.disputed &&
          !token.latestRequest.resolved &&
          token.latestRequest.dispute.status !==
            tcrConstants.DISPUTE_STATUS.Appealable.toString() && (
            <div className="TokenDescription">
              <hr className="TokenDescription-separator" />
              <h3>Evidence</h3>
              <div className="TokenDescription-evidence">
                <div className="TokenDescription-evidence--list">
                  {evidences.map(evidence => (
                    <div
                      className="TokenDescription-evidence--item"
                      key={evidence.fileHash}
                      onClick={this.handleViewEvidenceClick(evidence)}
                    >
                      <FontAwesomeIcon icon={evidence.icon} size="2x" />
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
            {token.badge.status ===
              tcrConstants.IN_CONTRACT_STATUS_ENUM['Absent'] && (
              <Button onClick={this.submitBadgeAction} type="secondary">
                Add Badge
              </Button>
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
    timeout: tokenActions.timeout,
    openActionModal: modalActions.openActionModal,
    feesTimeout: tokenActions.feesTimeout,
    toggleFilter: filterActions.toggleFilter
  }
)(TokenDetails)
