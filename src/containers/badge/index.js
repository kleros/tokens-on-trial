import React, { PureComponent } from 'react'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import Img from 'react-image'
import * as mime from 'mime-types'
import { BeatLoader } from 'react-spinners'
import { Link } from 'react-router-dom'
import Countdown from 'react-countdown-now'

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
import CountdownRenderer from '../../components/countdown-renderer'
import { hasPendingRequest } from '../../utils/tcr'
import { truncateMiddle, getRemainingTime } from '../../utils/ui'
import { getFileIcon } from '../../utils/evidence'
import getActionButton from '../../components/action-button'
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
    countdownCompleted: false,
    evidences: []
  }

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

  withdrawFunds = async () => {
    const { withdrawBadgeFunds, badge } = this.props
    withdrawBadgeFunds({
      address: badge.addr,
      request: badge.numberOfRequests - 1
    })
  }

  componentDidMount() {
    const { match, fetchBadge } = this.props
    const { tokenAddr } = match.params
    fetchBadge(tokenAddr)
    arbitrableAddressList.events.RewardWithdrawal().on('data', event => {
      const { tokenAddr } = match.params
      if (tokenAddr === event.returnValues._address) fetchBadge(tokenAddr)
    })
    arbitrableAddressList.events.AddressStatusChange().on('data', event => {
      const { tokenAddr } = match.params
      if (tokenAddr === event.returnValues._address) fetchBadge(tokenAddr)
    })
    arbitrator.events.AppealPossible().on('data', event => {
      const { badge } = this.state
      if (!badge) return
      const { latestRequest } = badge

      if (
        latestRequest.disputeID === Number(event.returnValues._disputeID) ||
        latestRequest.appealDisputeID === Number(event.returnValues._disputeID)
      )
        fetchBadge(tokenAddr)
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
      )
        fetchBadge(tokenAddr)
    })
    arbitrableAddressList.events
      .WaitingOpponent({ fromBlock: 0 })
      .on('data', async e => {
        if (e.returnValues._address === tokenAddr) fetchBadge(tokenAddr)
      })
  }

  submitBadgeAction = () =>
    this.handleActionClick(modalConstants.ACTION_MODAL_ENUM.SubmitBadge)

  componentWillReceiveProps(nextProps) {
    const { badge } = nextProps
    if (badge) this.setState({ badge })
  }

  render() {
    const { evidences, countdownCompleted } = this.state
    const {
      badge,
      accounts,
      filter,
      match,
      arbitrableAddressListData
    } = this.props
    const { filters } = filter
    const { tokenAddr } = match.params

    if (!badge)
      return (
        <div className="Page Page--loading">
          <BeatLoader color="#3d464d" />
        </div>
      )

    if (badge.addr !== tokenAddr) return window.location.reload()

    let losingSide
    const userAccount = accounts.data[0]
    const { latestRequest } = badge
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

    const time = getRemainingTime(
      badge,
      arbitrableAddressListData,
      tcrConstants,
      losingSide
    )

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
              <Link
                to={`/token/${badge.token.addr}`}
                className="BadgeDetails-token"
              >
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
              </Link>
            </>
          )}
          {latestRequest.withdrawable > 0 && (
            <>
              <div className="TokenDetails-divider" />
              <h5
                className="TokenDetails-withdraw"
                onClick={this.withdrawFunds}
              >
                <span className="TokenDetails-withdraw-value">
                  {web3.utils.fromWei(latestRequest.withdrawable.toString())}{' '}
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
              {latestRequest.dispute &&
                Number(latestRequest.dispute.status) ===
                  tcrConstants.DISPUTE_STATUS.Appealable &&
                !latestRequest.latestRound.appealed && (
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
                    {tcrConstants.RULING_OPTIONS[latestRequest.dispute.ruling]}{' '}
                    Request
                  </span>
                )}
              {!(
                badge.clientStatus <= 1 ||
                (hasPendingRequest(badge.status, badge.latestRequest) &&
                  latestRequest.dispute &&
                  latestRequest.dispute.status !==
                    tcrConstants.DISPUTE_STATUS.Appealable.toString())
              ) &&
                !countdownCompleted &&
                time > 0 && (
                  <span
                    className="BadgeDetails-meta--aligned"
                    style={{ display: 'flex', alignItems: 'center' }}
                  >
                    {!latestRequest.dispute && (
                      <>
                        <FontAwesomeIcon
                          className="TokenDetails-icon"
                          color={tcrConstants.STATUS_COLOR_ENUM[4]}
                          icon="clock"
                        />
                        <div className="BadgeDetails-timer">
                          {`${
                            latestRequest.dispute &&
                            latestRequest.dispute.status !==
                              tcrConstants.DISPUTE_STATUS.Appealable.toString()
                              ? 'Appeal'
                              : 'Challenge'
                          } Deadline`}{' '}
                          {time ? (
                            <Countdown
                              date={Date.now() + time}
                              renderer={CountdownRenderer}
                              onComplete={this.onCountdownComplete}
                            />
                          ) : (
                            '--:--:--'
                          )}
                        </div>
                      </>
                    )}
                  </span>
                )}
            </div>
            <div className="BadgeDetails-action">
              {getActionButton({
                item: badge,
                userAccount: accounts.data[0],
                tcr: arbitrableAddressListData,
                countdownCompleted,
                handleActionClick: this.handleActionClick,
                handleExecuteRequestClick: this.handleExecuteRequestClick,
                isBadge: true
              })}
            </div>
          </div>
        </div>
        <br />
        {badge.latestRequest && !latestRequest.resolved && (
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
