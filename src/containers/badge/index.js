import React, { PureComponent } from 'react'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import Img from 'react-image'
import * as mime from 'mime-types'

import {
  arbitrableAddressList,
  arbitrator,
  web3
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
import * as tokenActions from '../../actions/token'
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
    badgeTimeout: PropTypes.func.isRequired,
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
    const { badgeTimeout, token } = this.props
    badgeTimeout(token)
  }

  handleFeesTimeoutClick = () => {
    const { badgeTimeout, token } = this.props
    badgeTimeout(token)
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
    const { arbitrableAddressListData } = this.props
    const { timestamp, countdown } = this.state
    let method
    let disabled = true
    let label = 'Loading...'
    let icon = 'spinner'

    if (
      !token ||
      !token.badge ||
      !arbitrableAddressListData.data ||
      token.creating ||
      token.updating
    )
      return (
        <Button disabled={disabled} type="primary">
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
    const { badge } = token
    const { latestRequest } = badge
    const { latestRound, challengerDepositTime } = latestRequest
    const submitterFees = latestRound.paidFees[tcrConstants.SIDE.Requester]
    const challengerFees = latestRound.paidFees[tcrConstants.SIDE.Challenger]

    if (hasPendingRequest(badge))
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
            console.info('asdfas')
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
                } else if (timestamp > appealPeriodEnd)
                  label = 'Waiting Enforcement'
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
        if (isRegistrationRequest(token.status)) label = 'Challenge Addition'
        else label = 'Challenge Removal'
      }
    else {
      disabled = false
      if (badge.status === tcrConstants.IN_CONTRACT_STATUS_ENUM['Registered']) {
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
      <Button disabled={disabled} onClick={method} type="primary">
        <FontAwesomeIcon className="BadgeDetails-icon" icon={icon} />
        {label}
      </Button>
    )
  }

  componentDidMount() {
    const { match, fetchToken } = this.props
    const { tokenID } = match.params
    fetchToken(tokenID)
    arbitrableAddressList.events.AddressStatusChange().on('data', event => {
      console.info('AddressStatusChange')
      const { token } = this.state
      if (!token) return

      console.info('there is a token')
      if (token.addr === event.returnValues._address) fetchToken(tokenID)
    })
    arbitrator.events.Ruling().on('data', event => {
      const { token } = this.state
      const { badge } = token
      const { latestRequest } = badge
      if (
        latestRequest.disputed &&
        (latestRequest.disputeID === Number(event.returnValues._disputeID) ||
          latestRequest.appealDisputeID ===
            Number(event.returnValues._disputeID))
      )
        fetchToken(tokenID)
    })
    arbitrator.events.AppealPossible().on('data', event => {
      console.info('appeal possible')
      const { token } = this.state
      if (!token || !token.badge) return

      const { latestRequest } = token.badge
      console.info('there is a token')
      if (
        latestRequest.disputed &&
        (latestRequest.disputeID === Number(event.returnValues._disputeID) ||
          latestRequest.appealDisputeID ===
            Number(event.returnValues._disputeID))
      ) {
        console.info('fetch token')
        fetchToken(tokenID)
      }
    })
    arbitrableAddressList.events
      .Evidence({ fromBlock: 0 })
      .on('data', async e => {
        const { token } = this.state
        if (!token || !token.badge) return

        const { latestRequest } = token.badge
        if (
          Number(e.returnValues._disputeID) === latestRequest.disputeID ||
          latestRequest.appealDisputeID === Number(e.returnValues._disputeID)
        ) {
          const evidence = JSON.parse(
            await (await fetch(e.returnValues._evidence)).json()
          )
          evidence.icon = getFileIcon(mime.lookup(evidence.fileTypeExtension))
          const { evidences } = this.state
          evidence.ID = web3.utils.sha3(JSON.stringify(evidence))
          this.setState({
            evidences: {
              ...evidences,
              [evidence.ID]: evidence
            }
          })
        }
      })
    arbitrableAddressList.events
      .Contribution({ fromBlock: 0 })
      .on('data', async e => {
        console.info('contribution')
        const { token } = this.state
        if (!token || !token.badge) return

        console.info('there is a token')
        if (e.returnValues._address === token.addr) fetchToken(tokenID)
      })
  }

  submitBadgeAction = () =>
    this.handleActionClick(modalConstants.ACTION_MODAL_ENUM.SubmitBadge)

  componentWillUnmount() {
    clearInterval(this.interval)
  }

  componentWillReceiveProps(nextProps) {
    let { token } = nextProps
    const { arbitrableAddressListData, accounts } = this.props
    const { countdown } = this.state
    console.info('will receive props')
    if (!token) {
      token = this.props
      console.info('no token from nextProps')
      console.info('token from this.props', token)
    } else this.setState({ token })

    if (
      token &&
      token.badge &&
      hasPendingRequest(token.badge) &&
      (countdown === null || countdown === 0) &&
      arbitrableAddressListData &&
      arbitrableAddressListData.data
    ) {
      console.info('badge init coundown')
      this.setState({ countdown: 'Loading...', token })
      const { badge } = token
      const { latestRequest } = badge

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
        console.info('time', time)
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
      })
    }
  }

  render() {
    const { countdown, evidences } = this.state
    const { token, accounts, filter, match } = this.props
    const { filters } = filter
    const { tokenID } = match.params

    if (!token || !token.badge)
      return (
        <div className="Page">
          <h5>Loading...</h5>
        </div>
      )

    if (token.ID !== tokenID) return window.location.reload()

    const { badge } = token
    return (
      <div className="Page">
        <FilterBar
          filter={filters}
          handleFilterChange={this.handleFilterChange}
        />
        <div className="BadgeDetails-header">
          <h3 className="BadgeDetails-header-title">Badge Details</h3>
          <Img
            className="BadgeDetails-header-img"
            src={`https://staging-cfs.s3.us-east-2.amazonaws.com/${
              token.symbolMultihash
            }`}
          />
          <h4 className="BadgeDetails-label-name">{token.name}</h4>
          <h4 className="BadgeDetails-label-ticker">{token.ticker}</h4>
        </div>
        <div className="BadgeDetails">
          <div className="BadgeDetails-card">
            <Img className="BadgeDetails-img" src={EthfinexLogo} />
            <div className="BadgeDetails-divider" />
            <div className="BadgeDetails-meta">
              <div className="BadgeDetails-meta--aligned">
                <span>
                  <a
                    className="BadgeDetails--link"
                    href={`https://etherscan.io/address/${token.addr}`}
                  >
                    <Img
                      className="BadgeDetails-icon BadgeDetails-meta--aligned"
                      src={EtherScanLogo}
                    />
                    {truncateMiddle(token.addr)}
                  </a>
                </span>
              </div>
              <div />
            </div>
            <div className="BadgeDetails-meta">
              <span className="BadgeDetails-meta--aligned">
                <FontAwesomeIcon
                  className="BadgeDetails-icon"
                  color={
                    tcrConstants.STATUS_COLOR_ENUM[token.badge.clientStatus]
                  }
                  icon={tcrConstants.STATUS_ICON_ENUM[token.badge.clientStatus]}
                />
                {this.toSentenceCase(
                  tcrConstants.STATUS_ENUM[token.badge.clientStatus]
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
                  <FontAwesomeIcon
                    className="TokenDetails-icon"
                    color={tcrConstants.STATUS_COLOR_ENUM[4]}
                    icon="clock"
                  />
                  <div className="BadgeDetails-timer">
                    {badge.latestRequest.dispute &&
                    badge.latestRequest.dispute.status ===
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
            <div className="BadgeDetails-action">
              {this.getActionButton(token, accounts.data[0])}
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
    token: state.token.token.data,
    accounts: state.wallet.accounts,
    arbitrableAddressListData:
      state.arbitrableAddressList.arbitrableAddressListData,
    filter: state.filter
  }),
  {
    openActionModal: modalActions.openActionModal,
    fetchToken: tokenActions.fetchToken,
    badgeTimeout: badgeActions.badgeTimeout,
    toggleFilter: filterActions.toggleFilter
  }
)(BadgeDetails)
