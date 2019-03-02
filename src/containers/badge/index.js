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
import Etherscan from '../../assets/images/etherscan.png'
import EthfinexLogo from '../../assets/images/ethfinex.svg'
import Button from '../../components/button'
import Modal from '../../components/modal'
import FilterBar from '../filter-bar'
import CountdownRenderer from '../../components/countdown-renderer'
import { hasPendingRequest } from '../../utils/tcr'
import { getRemainingTime } from '../../utils/ui'
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
    evidences: [],
    appealModalOpen: false,
    loserCountdownCompleted: false,
    winnerCountdownCompleted: false
  }

  handleFilterChange = key => {
    const { toggleFilter } = this.props
    toggleFilter(key)
  }

  handleActionClick = (action, side) => {
    const { openActionModal } = this.props
    openActionModal(action, side)
  }

  fundAppeal = () => {
    this.setState({ appealModalOpen: true })
  }

  handleExecuteRequestClick = () => {
    const { timeout, badge, openActionModal } = this.props
    openActionModal(modalConstants.ACTION_MODAL_ENUM.TxPending)
    timeout(badge.addr)
  }

  handleFeesTimeoutClick = () => {
    const { timeout, badge, openActionModal } = this.props
    openActionModal(modalConstants.ACTION_MODAL_ENUM.TxPending)
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

  onCountdownComplete = () => {
    this.setState({ countdownCompleted: true })
  }

  onWinnerCoundownComplete = () => {
    this.setState({ winnerCountdownCompleted: true })
  }

  onLoserCoundownComplete = () => {
    this.setState({ loserCountdownCompleted: true })
  }

  withdrawFunds = async () => {
    const { withdrawBadgeFunds, badge, openActionModal } = this.props
    openActionModal(modalConstants.ACTION_MODAL_ENUM.TxPending)
    withdrawBadgeFunds({
      address: badge.addr,
      item: badge
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
  }

  submitBadgeAction = () =>
    this.handleActionClick(modalConstants.ACTION_MODAL_ENUM.SubmitBadge)

  componentWillReceiveProps(nextProps) {
    const { badge } = nextProps
    if (badge) this.setState({ badge })
  }

  render() {
    const {
      evidences,
      countdownCompleted,
      appealModalOpen,
      loserCountdownCompleted,
      winnerCountdownCompleted
    } = this.state

    const {
      badge,
      accounts,
      filter,
      match,
      arbitrableAddressListData
    } = this.props
    const { filters } = filter
    const { tokenAddr } = match.params

    if (!badge || badge.addr !== tokenAddr)
      return (
        <div className="Page Page--loading">
          <BeatLoader color="#3d464d" />
        </div>
      )

    if (badge.numberOfRequests === 0)
      return (
        <div className="PageNotFound">
          <div className="PageNotFound-message">
            404.
            <br />
            <small>
              <h3>Badge status not found.</h3>
              <p style={{ fontSize: '0.6em' }}>Was it ever submitted?</p>
            </small>
          </div>
        </div>
      )

    let losingSide
    let decisiveRuling
    let requesterIsLoser
    let challengerIsLoser
    const userAccount = accounts.data[0]
    const { latestRequest } = badge
    if (
      latestRequest.dispute &&
      Number(latestRequest.dispute.status) ===
        tcrConstants.DISPUTE_STATUS.Appealable &&
      !latestRequest.latestRound.appealed
    ) {
      if (
        userAccount === latestRequest.parties[tcrConstants.SIDE.Requester] &&
        latestRequest.dispute.ruling === tcrConstants.RULING_OPTIONS.Refuse
      )
        losingSide = true
      else if (
        userAccount === latestRequest.parties[tcrConstants.SIDE.Challenger] &&
        latestRequest.dispute.ruling === tcrConstants.RULING_OPTIONS.Accept
      )
        losingSide = true

      if (latestRequest.dispute.ruling !== tcrConstants.RULING_OPTIONS.Other) {
        decisiveRuling = true
        requesterIsLoser =
          latestRequest.dispute.ruling === tcrConstants.RULING_OPTIONS.Refuse
        challengerIsLoser =
          latestRequest.dispute.ruling === tcrConstants.RULING_OPTIONS.Accept
      }
    }

    const time = getRemainingTime(
      badge,
      arbitrableAddressListData,
      tcrConstants,
      losingSide,
      decisiveRuling
    )

    const SIDE =
      userAccount === latestRequest.parties[tcrConstants.SIDE.Requester]
        ? tcrConstants.SIDE.Requester
        : userAccount === latestRequest.parties[tcrConstants.SIDE.Challenger]
        ? tcrConstants.SIDE.Challenger
        : tcrConstants.SIDE.None

    const loserRemainingTime = getRemainingTime(
      badge,
      arbitrableAddressListData,
      tcrConstants,
      true,
      decisiveRuling
    )

    const winnerRemainingTime = getRemainingTime(
      badge,
      arbitrableAddressListData,
      tcrConstants,
      false,
      decisiveRuling
    )

    return (
      <div className="Page">
        <FilterBar
          filter={filters}
          handleFilterChange={this.handleFilterChange}
        />
        <div
          style={{ display: 'flex', flexDirection: 'row', overflowX: 'auto' }}
        >
          <h4 style={{ marginLeft: 0, minWidth: '247px' }}>Badge Details</h4>
          {badge.token && (
            <>
              <div className="TokenDetails-divider" />
              <Link
                to={`/token/${badge.token.ID}`}
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
          {badge.withdrawable.gt(web3.utils.toBN(0)) && (
            <>
              <div className="TokenDetails-divider" />
              <h5
                className="TokenDetails-withdraw"
                onClick={this.withdrawFunds}
              >
                <span className="TokenDetails-withdraw-value">
                  {Number(
                    web3.utils.fromWei(badge.withdrawable.toString())
                  ).toFixed(4)}{' '}
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
            <div className="BadgeDetails-card-content">
              <Img className="BadgeDetails-img" src={EthfinexLogo} />
              <div className="BadgeDetails-divider" />
              <div className="BadgeDetails-description">
                <div>
                  <h4 style={{ margin: '0px' }}>Badge Description</h4>
                  <p style={{ lineHeight: '1.5', marginTop: '10px' }}>
                    Tokens with the Ethfinex badge can participate in the
                    Ethfinex Community Vote to become traded on the Ethfinex
                    platform. To be eligible to receive the badge, the project
                    and it's associated token must comply with the minimum set
                    of criteria defined in the criteria document. Click{' '}
                    <a
                      className="TokenDetails-withdraw"
                      style={{ margin: 0, textDecoration: 'underline' }}
                    >
                      here
                    </a>{' '}
                    to to view the requirements.
                  </p>
                </div>
                <div style={{ display: 'flex', marginTop: 'auto' }}>
                  <div
                    className="BadgeDetails-meta"
                    style={{ marginRight: 'auto' }}
                  >
                    <span
                      className="BadgeDetails-meta--aligned BadgeDetails-timer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        color: '#3d464d'
                      }}
                    >
                      <a
                        className="BadgeDetails--link"
                        href={`https://etherscan.io/address/${tokenAddr}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <div
                          className="BadgeDetails-meta--aligned"
                          style={{ display: 'flex', alignItems: 'center' }}
                        >
                          <Img
                            className="BadgeDetails-icon BadgeDetails-meta--aligned"
                            src={Etherscan}
                          />
                          <div style={{ overflowX: 'auto' }}>
                            {web3.utils.toChecksumAddress(tokenAddr)}
                          </div>
                        </div>
                      </a>
                    </span>
                  </div>
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
                          className="BadgeDetails-icon"
                          color={tcrConstants.STATUS_COLOR_ENUM[5]}
                          icon="balance-scale"
                          style={{ marginRight: '10px' }}
                        />
                        Arbitration Result:{' '}
                        {
                          tcrConstants.RULING_OPTIONS[
                            latestRequest.dispute.ruling
                          ]
                        }{' '}
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
                    (!latestRequest.dispute ||
                      (latestRequest.dispute.status ===
                        tcrConstants.DISPUTE_STATUS.Appealable.toString() &&
                        time > 0)) && (
                      <>
                        {!latestRequest.dispute ? (
                          <>
                            {time > 0 && !countdownCompleted && (
                              <span
                                style={{
                                  display: 'flex',
                                  alignItems: 'center'
                                }}
                              >
                                <div
                                  className="BadgeDetails-timer"
                                  style={{ fontSize: '14px' }}
                                >
                                  <FontAwesomeIcon
                                    className="BadgeDetails-icon"
                                    color={tcrConstants.STATUS_COLOR_ENUM[4]}
                                    icon="clock"
                                  />
                                  {'Challenge Deadline '}
                                  <Countdown
                                    date={Date.now() + time}
                                    renderer={CountdownRenderer}
                                    onComplete={this.onCountdownComplete}
                                  />
                                </div>
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            {latestRequest.dispute.status ===
                              tcrConstants.DISPUTE_STATUS.Appealable.toString() && (
                              <>
                                {(SIDE !== tcrConstants.SIDE.None ||
                                  !decisiveRuling) &&
                                !countdownCompleted ? (
                                  <span
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      marginTop: '5px'
                                    }}
                                  >
                                    <div className="BadgeDetails-timer">
                                      <FontAwesomeIcon
                                        className="BadgeDetails-icon"
                                        color={
                                          tcrConstants.STATUS_COLOR_ENUM[4]
                                        }
                                        icon="clock"
                                      />
                                      {'Appeal Deadline '}
                                      <Countdown
                                        date={Date.now() + time}
                                        renderer={CountdownRenderer}
                                        onComplete={this.onCountdownComplete}
                                      />
                                    </div>
                                  </span>
                                ) : (
                                  <>
                                    {!winnerCountdownCompleted && (
                                      <span
                                        style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          margin: '5px 0'
                                        }}
                                      >
                                        <div className="BadgeDetails-timer">
                                          <FontAwesomeIcon
                                            className="BadgeDetails-icon"
                                            color={
                                              tcrConstants.STATUS_COLOR_ENUM[4]
                                            }
                                            icon="clock"
                                          />
                                          {'Winner Appeal Deadline '}
                                          <Countdown
                                            date={
                                              Date.now() + winnerRemainingTime
                                            }
                                            renderer={CountdownRenderer}
                                            onComplete={
                                              this.onWinnerCoundownComplete
                                            }
                                          />
                                        </div>
                                      </span>
                                    )}
                                    {loserRemainingTime > 0 &&
                                      !loserCountdownCompleted && (
                                        <span
                                          style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            margin: '5px 0'
                                          }}
                                        >
                                          <div className="BadgeDetails-timer">
                                            <FontAwesomeIcon
                                              className="BadgeDetails-icon"
                                              color={
                                                tcrConstants
                                                  .STATUS_COLOR_ENUM[4]
                                              }
                                              icon="clock"
                                            />
                                            {'Loser Appeal Deadline '}
                                            <Countdown
                                              date={
                                                Date.now() + loserRemainingTime
                                              }
                                              renderer={CountdownRenderer}
                                              onComplete={
                                                this.onLoserCoundownComplete
                                              }
                                            />
                                          </div>
                                        </span>
                                      )}
                                  </>
                                )}
                              </>
                            )}
                          </>
                        )}
                      </>
                    )}
                </div>
              </div>
            </div>
            <div className="BadgeDetails-footer">
              <div
                style={{
                  whiteSpace: 'pre-line',
                  textAlign: 'center',
                  fontSize: '14px',
                  width: '264px'
                }}
              >
                {`Compliant With \n Ethfinex Listing Critera`}
              </div>
              <div className="BadgeDetails-divider" style={{ height: '60%' }} />
              <span
                className="BadgeDetails-meta--aligned"
                style={{ fontSize: '14px' }}
              >
                <FontAwesomeIcon
                  className="BadgeDetails-icon"
                  color={tcrConstants.STATUS_COLOR_ENUM[badge.clientStatus]}
                  icon={tcrConstants.STATUS_ICON_ENUM[badge.clientStatus]}
                />
                {this.toSentenceCase(
                  tcrConstants.BADGE_STATUS_ENUM[badge.clientStatus]
                )}
              </span>
              <div style={{ marginLeft: 'auto', marginRight: '26px' }}>
                {Number(badge.status) > 1 &&
                latestRequest.dispute &&
                Number(latestRequest.dispute.status) ===
                  tcrConstants.DISPUTE_STATUS.Appealable &&
                latestRequest.numberOfRounds > 1 &&
                SIDE === tcrConstants.SIDE.None ? (
                  <Button
                    type="primary"
                    onClick={this.fundAppeal}
                    disabled={
                      decisiveRuling
                        ? winnerCountdownCompleted && loserCountdownCompleted
                        : countdownCompleted
                    }
                  >
                    <FontAwesomeIcon
                      className="BadgeDetails-icon"
                      icon="gavel"
                    />
                    {(decisiveRuling
                    ? !winnerCountdownCompleted || !loserCountdownCompleted
                    : !countdownCompleted)
                      ? 'Fund Appeal'
                      : 'Waiting Enforcement'}
                  </Button>
                ) : (
                  getActionButton({
                    item: badge,
                    userAccount,
                    tcr: arbitrableAddressListData,
                    countdownCompleted,
                    handleActionClick: this.handleActionClick,
                    handleExecuteRequestClick: this.handleExecuteRequestClick,
                    isBadge: true
                  })
                )}
              </div>
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
        {/* eslint-disable react/jsx-no-bind */}
        <Modal
          className="ActionModal"
          isOpen={appealModalOpen}
          onRequestClose={() => this.setState({ appealModalOpen: false })}
        >
          <h3 className="Modal-title">
            <FontAwesomeIcon className="Appeal-icon" icon="coins" />
            Fund Appeal
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
              disabled={
                decisiveRuling &&
                requesterIsLoser &&
                (loserRemainingTime === 0 || loserCountdownCompleted)
              }
              onClick={() => {
                this.setState({ appealModalOpen: false })
                this.handleActionClick(
                  modalConstants.ACTION_MODAL_ENUM['FundAppealBadge'],
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
              disabled={
                decisiveRuling &&
                challengerIsLoser &&
                (loserRemainingTime === 0 || loserCountdownCompleted)
              }
              onClick={() => {
                this.setState({ appealModalOpen: false })
                this.handleActionClick(
                  modalConstants.ACTION_MODAL_ENUM['FundAppealBadge'],
                  tcrConstants.SIDE.Challenger
                )
              }}
            >
              Fund Challenger
            </Button>
          </div>
        </Modal>
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
