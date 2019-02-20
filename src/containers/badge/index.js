import React, { PureComponent } from 'react'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import Img from 'react-image'
import * as mime from 'mime-types'

import {
  arbitrableAddressList,
  arbitrator,
  web3,
  archon
} from '../../bootstrap/dapp-api'
import EtherScanLogo from '../../assets/images/etherscan.png'
import EthfinexLogo from '../../assets/images/ethfinex.svg'
import Button from '../../components/button'
import FilterBar from '../filter-bar'
import {
  hasPendingRequest,
  isRegistrationRequest,
  getBlock
} from '../../utils/tcr'
import { truncateMiddle, getRemainingTime } from '../../utils/ui'
import { getFileIcon } from '../../utils/evidence'
import * as filterActions from '../../actions/filter'
import * as filterSelectors from '../../reducers/filter'
import * as badgeActions from '../../actions/badge'
import * as modalActions from '../../actions/modal'
import * as modalConstants from '../../constants/modal'
import * as tcrConstants from '../../constants/tcr'
import * as walletSelectors from '../../reducers/wallet'
import * as arbitrableAddressListSelectors from '../../reducers/arbitrable-address-list'

import './badge.css'

class BadgeDetails extends PureComponent {
  static propTypes = {
    // State
    filter: filterSelectors.filterShape.isRequired,
    accounts: walletSelectors.accountsShape.isRequired,
    arbitrableAddressListData:
      arbitrableAddressListSelectors.arbitrableAddressListDataShape.isRequired,
    badge: PropTypes.shape({}),
    match: PropTypes.shape({
      params: PropTypes.shape({
        tokenID: PropTypes.string
      })
    }),

    // Functions
    timeout: PropTypes.func.isRequired,
    fetchBadge: PropTypes.func.isRequired,
    openActionModal: PropTypes.func.isRequired,
    toggleFilter: PropTypes.func.isRequired,
    withdrawBadgeFunds: PropTypes.func.isRequired
  }

  static defaultProps = {
    match: {},
    badge: null
  }

  state = {
    timestamp: null,
    countdown: null,
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
    const { timeout, badge, openActionModal } = this.props
    openActionModal(modalConstants.ACTION_MODAL_ENUM.Timeout)
    timeout(badge.addr)
  }

  handleFeesTimeoutClick = () => {
    const { timeout, badge, openActionModal } = this.props
    openActionModal(modalConstants.ACTION_MODAL_ENUM.Timeout)
    timeout(badge)
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
    input = input ? input.toLowerCase() : ''
    return input.charAt(0).toUpperCase() + input.slice(1)
  }

  getActionButton = (item, userAccount) => {
    const { arbitrableAddressListData } = this.props
    const { timestamp, countdown } = this.state
    let method
    let disabled = true
    let label = 'Loading...'
    let icon = 'spinner'

    if (
      !item ||
      !arbitrableAddressListData.data ||
      item.creating ||
      item.updating
    )
      return (
        <Button disabled style={{ cursor: 'not-allowed' }} type="primary">
          <FontAwesomeIcon className="BadgeDetails-icon" icon={icon} />
          {label}
        </Button>
      )

    const challengePeriodDuration = Number(
      arbitrableAddressListData.data.challengePeriodDuration
    )
    const arbitrationFeesWaitingTime = Number(
      arbitrableAddressListData.data.arbitrationFeesWaitingTime
    )
    const { latestRequest } = item
    const { latestRound, challengerDepositTime } = latestRequest
    let submitterFees
    let challengerFees
    if (latestRound) {
      submitterFees = latestRound.paidFees[tcrConstants.SIDE.Requester]
      challengerFees = latestRound.paidFees[tcrConstants.SIDE.Challenger]
    }

    if (hasPendingRequest(item))
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
              latestRequest.parties[tcrConstants.SIDE.Requester] ||
            userAccount === latestRequest.parties[tcrConstants.SIDE.Challenger]
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
                latestRequest.parties[tcrConstants.SIDE.Requester]
                  ? tcrConstants.SIDE.Requester
                  : tcrConstants.SIDE.Challenger

              if (
                latestRound.requiredForSide[SIDE] === 0 ||
                latestRound.paidFees[SIDE] < latestRound.requiredForSide[SIDE]
              ) {
                let losingSide = false
                if (
                  userAccount ===
                    latestRequest.parties[tcrConstants.SIDE.Requester] &&
                  latestRequest.dispute.ruling ===
                    tcrConstants.RULING_OPTIONS.Refuse.toString()
                )
                  losingSide = true
                else if (
                  userAccount ===
                    latestRequest.parties[tcrConstants.SIDE.Challenger] &&
                  latestRequest.dispute.ruling ===
                    tcrConstants.RULING_OPTIONS.Accept.toString()
                )
                  losingSide = true

                if (!losingSide) {
                  label = 'Fund Appeal'
                  disabled = false
                  method = () =>
                    this.handleActionClick(
                      modalConstants.ACTION_MODAL_ENUM.FundAppealBadge,
                      SIDE
                    )
                } else if (timestamp < endOfFirstHalf) {
                  label = 'Fund Appeal'
                  disabled = false
                  method = () =>
                    this.handleActionClick(
                      modalConstants.ACTION_MODAL_ENUM.FundAppealBadge,
                      SIDE
                    )
                }
              } else label = 'Waiting For Opponent Fees'
            } else label = 'Waiting Enforcement'
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
        (userAccount === latestRequest.parties[tcrConstants.SIDE.Requester] ||
          userAccount === latestRequest.parties[tcrConstants.SIDE.Challenger])
      ) {
        icon = 'gavel'
        label = 'Pay Arbitration Fees'
        disabled = false
        if (
          challengerFees > submitterFees &&
          userAccount === latestRequest.parties[tcrConstants.SIDE.Requester]
        )
          method = () =>
            this.handleActionClick(
              modalConstants.ACTION_MODAL_ENUM.FundRequesterBadge
            )
        else if (
          submitterFees > challengerFees &&
          userAccount === latestRequest.parties[tcrConstants.SIDE.Challenger]
        )
          method = () =>
            this.handleActionClick(
              modalConstants.ACTION_MODAL_ENUM.FundChallengerBadge
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
          this.handleActionClick(
            modalConstants.ACTION_MODAL_ENUM.ChallengeBadge
          )
        if (isRegistrationRequest(item.status)) label = 'Challenge Addition'
        else label = 'Challenge Removal'
      }
    else {
      disabled = false
      if (item.status === tcrConstants.IN_CONTRACT_STATUS_ENUM['Registered']) {
        method = () =>
          this.handleActionClick(modalConstants.ACTION_MODAL_ENUM.ClearBadge)
        label = 'Remove Badge'
        icon = 'times-circle'
      } else {
        label = 'Add Badge'
        icon = 'plus'
        method = () =>
          this.handleActionClick(modalConstants.ACTION_MODAL_ENUM.ResubmitBadge)
      }
    }

    return (
      <Button
        disabled={disabled}
        onClick={method}
        style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
        type="primary"
      >
        <FontAwesomeIcon className="BadgeDetails-icon" icon={icon} />
        {label}
      </Button>
    )
  }

  initCountDown = async () => {
    const { arbitrableAddressListData, badge, accounts } = this.props
    const { countdown, listeningForEvidence } = this.state
    this.setState({ badge })

    if (
      badge &&
      hasPendingRequest(badge) &&
      countdown === null &&
      arbitrableAddressListData &&
      arbitrableAddressListData.data &&
      arbitrator &&
      arbitrableAddressList
    ) {
      this.setState({ countdown: 'Loading...', badge })
      const { latestRequest } = badge

      if (!listeningForEvidence && latestRequest && latestRequest.disputed)
        // Listen for evidence events.
        this.setState({ listeningForEvidence: true })
      archon.arbitrable
        .getEvidence(
          arbitrableAddressList._address,
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
          badge,
          arbitrableAddressListData,
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
    const { withdrawBadgeFunds, badge } = this.props
    withdrawBadgeFunds({
      address: badge.addr,
      request: badge.numberOfRequests - 1
    })
  }

  componentDidUpdate() {
    this.initCountDown()
  }

  componentDidMount() {
    const { match, fetchBadge } = this.props
    const { tokenAddr } = match.params
    fetchBadge(tokenAddr)
    arbitrableAddressList.events.RewardWithdrawal().on('data', event => {
      const { tokenAddr } = match.params
      if (tokenAddr === event.returnValues._address) {
        clearInterval(this.interval)
        this.setState({ countdown: null })
        fetchBadge(tokenAddr)
      }
    })
    arbitrableAddressList.events.AddressStatusChange().on('data', event => {
      const { tokenAddr } = match.params
      if (tokenAddr === event.returnValues._address) {
        clearInterval(this.interval)
        this.setState({ countdown: null })
        fetchBadge(tokenAddr)
      }
    })
    arbitrator.events.AppealPossible().on('data', event => {
      const { badge } = this.state
      if (!badge) return
      const { latestRequest } = badge

      if (
        latestRequest.disputeID === Number(event.returnValues._disputeID) ||
        latestRequest.appealDisputeID === Number(event.returnValues._disputeID)
      ) {
        clearInterval(this.interval)
        this.setState({ countdown: null })
        fetchBadge(tokenAddr)
      }
    })
    arbitrableAddressList.events
      .Evidence({ fromBlock: 0 })
      .on('data', async e => {
        const { badge } = this.state
        if (!badge) return
        const { latestRequest } = badge

        if (latestRequest.evidenceGroupID !== e.returnValues._evidenceGroupID)
          return

        archon.arbitrable
          .getEvidence(
            arbitrableAddressList._address,
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
    arbitrableAddressList.events.Ruling().on('data', event => {
      const { badge } = this.state
      if (!badge) return
      const { latestRequest } = badge
      if (
        latestRequest.disputed &&
        (latestRequest.disputeID === Number(event.returnValues._disputeID) ||
          latestRequest.appealDisputeID ===
            Number(event.returnValues._disputeID))
      ) {
        clearInterval(this.interval)
        this.setState({ countdown: null })
        fetchBadge(tokenAddr)
      }
    })
    arbitrableAddressList.events
      .WaitingOpponent({ fromBlock: 0 })
      .on('data', async e => {
        if (e.returnValues._address === tokenAddr) {
          clearInterval(this.interval)
          this.setState({ countdown: null })
          fetchBadge(tokenAddr)
        }
      })
  }

  submitBadgeAction = () =>
    this.handleActionClick(modalConstants.ACTION_MODAL_ENUM.SubmitBadge)

  componentWillUnmount() {
    clearInterval(this.interval)
  }

  componentWillReceiveProps(nextProps) {
    const { badge } = nextProps
    if (!badge) return
    else this.setState({ badge })
    this.initCountDown()
  }

  render() {
    const { countdown, evidences } = this.state
    const { badge, accounts, filter, match } = this.props
    const { filters } = filter
    const { tokenAddr } = match.params

    if (!badge)
      return (
        <div className="Page">
          <h5>Loading...</h5>
        </div>
      )

    if (badge.addr !== tokenAddr) return window.location.reload()

    return (
      <div className="Page">
        <FilterBar
          filter={filters}
          handleFilterChange={this.handleFilterChange}
        />
        <div style={{ display: 'flex', flexDirection: 'row' }}>
          <h4>Badge Details</h4>
          {badge.token && (
            <>
              <div className="TokenDetails-divider" />
              <div className="BadgeDetails-token">
                <Img
                  className="BadgeDetails-header-img"
                  src={`https://staging-cfs.s3.us-east-2.amazonaws.com/${
                    badge.token.symbolMultihash
                  }`}
                />
                <h4 className="BadgeDetails-label-name">{badge.token.name}</h4>
                <h4 className="BadgeDetails-label-ticker">
                  {badge.token.ticker}
                </h4>
              </div>
            </>
          )}
          {badge.latestRequest.withdrawable > 0 && (
            <>
              <div className="TokenDetails-divider" />
              <h5
                className="TokenDetails-withdraw"
                onClick={this.withdrawFunds}
              >
                <span className="TokenDetails-withdraw-value">
                  {web3.utils.fromWei(
                    badge.latestRequest.withdrawable.toString()
                  )}{' '}
                  ETH{' '}
                </span>
                Withdraw Funds
              </h5>
            </>
          )}
        </div>
        <hr className="TokenDescription-separator" />
        <div className="BadgeDetails">
          <div className="BadgeDetails-card">
            <Img className="BadgeDetails-img" src={EthfinexLogo} />
            <div className="BadgeDetails-divider" />
            <div className="BadgeDetails-meta">
              <div className="BadgeDetails-meta--aligned">
                <span>
                  <a
                    className="BadgeDetails--link"
                    href={`https://etherscan.io/address/${tokenAddr}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Img
                      className="BadgeDetails-icon BadgeDetails-meta--aligned"
                      src={EtherScanLogo}
                    />
                    {truncateMiddle(tokenAddr)}
                  </a>
                </span>
              </div>
              <div />
            </div>
            <div className="BadgeDetails-meta">
              <span className="BadgeDetails-meta--aligned">
                <FontAwesomeIcon
                  className="BadgeDetails-icon"
                  color={tcrConstants.STATUS_COLOR_ENUM[badge.clientStatus]}
                  icon={tcrConstants.STATUS_ICON_ENUM[badge.clientStatus]}
                />
                {this.toSentenceCase(
                  tcrConstants.STATUS_ENUM[badge.clientStatus]
                )}
              </span>
              {badge.latestRequest.dispute &&
                Number(badge.latestRequest.dispute.status) ===
                  tcrConstants.DISPUTE_STATUS.Appealable &&
                !badge.latestRequest.latestRound.appealed && (
                  <span
                    className="BadgeDetails-meta--aligned BadgeDetails-timer"
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
                        badge.latestRequest.dispute.status
                      ]
                    }{' '}
                    Request
                  </span>
                )}
              {!(
                badge.clientStatus <= 1 ||
                (hasPendingRequest(badge.status, badge.latestRequest) &&
                  badge.latestRequest.dispute &&
                  badge.latestRequest.dispute.status !==
                    tcrConstants.DISPUTE_STATUS.Appealable.toString()) ||
                Number(countdown) === 0
              ) && (
                <span
                  className="BadgeDetails-meta--aligned"
                  style={{ display: 'flex', alignItems: 'center' }}
                >
                  {!badge.latestRequest.dispute && (
                    <>
                      <FontAwesomeIcon
                        className="TokenDetails-icon"
                        color={tcrConstants.STATUS_COLOR_ENUM[4]}
                        icon="clock"
                      />
                      <div className="BadgeDetails-timer">
                        {`Challenge Deadline ${
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
            <div className="BadgeDetails-action">
              {this.getActionButton(badge, accounts.data[0])}
            </div>
          </div>
        </div>
        <br />
        {badge.latestRequest.disputed &&
          !badge.latestRequest.resolved &&
          badge.latestRequest.dispute.status !==
            tcrConstants.DISPUTE_STATUS.Appealable.toString() && (
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
      </div>
    )
  }
}

export default connect(
  state => ({
    badge: state.badge.badge.data,
    accounts: state.wallet.accounts,
    arbitrableAddressListData:
      state.arbitrableAddressList.arbitrableAddressListData,
    filter: state.filter
  }),
  {
    openActionModal: modalActions.openActionModal,
    fetchBadge: badgeActions.fetchBadge,
    timeout: badgeActions.timeout,
    withdrawBadgeFunds: badgeActions.withdrawBadgeFunds,
    toggleFilter: filterActions.toggleFilter
  }
)(BadgeDetails)
