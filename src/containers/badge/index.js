import React, { PureComponent } from 'react'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import Img from 'react-image'
import * as mime from 'mime-types'
import { BeatLoader } from 'react-spinners'
import { Link } from 'react-router-dom'
import Countdown from 'react-countdown-now'
import Progress from 'react-progressbar'
import Archon from '@kleros/archon'

import {
  arbitrableAddressList,
  arbitrator,
  web3,
  ETHFINEX_CRITERIA_URL,
  archon,
  FILE_BASE_URL,
  IPFS_URL
} from '../../bootstrap/dapp-api'
import UnknownToken from '../../assets/images/unknown.svg'
import Etherscan from '../../assets/images/etherscan.png'
import EthfinexLogo from '../../assets/images/ethfinex.svg'
import Button from '../../components/button'
import Modal from '../../components/modal'
import FilterBar from '../filter-bar'
import CountdownRenderer from '../../components/countdown-renderer'
import { hasPendingRequest } from '../../utils/tcr'
import {
  getRemainingTime,
  truncateMiddle,
  rulingMessage,
  userFriendlyLabel
} from '../../utils/ui'
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
    evidences: null,
    appealModalOpen: false,
    loserCountdownCompleted: false,
    winnerCountdownCompleted: false,
    evidenceListenerSet: false,
    evidencePeriodEnded: false
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

  onCountdownComplete = time => {
    if (typeof time === 'number' && time > 0) return
    this.setState({ countdownCompleted: true })
  }

  onWinnerCountdownComplete = time => {
    if (typeof time === 'number' && time > 0) return
    this.setState({ winnerCountdownCompleted: true })
  }

  onLoserCountdownComplete = time => {
    if (typeof time === 'number' && time > 0) return
    this.setState({ loserCountdownCompleted: true })
  }

  onEvidenceCountdownComplete = time => {
    if (typeof time === 'number' && time > 0) return
    this.setState({ evidencePeriodEnded: true })
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
    const { badge: nextBadge } = nextProps
    const { match, fetchBadge } = this.props
    const { fetching } = this.state
    const { tokenAddr } = match.params
    if (nextBadge && nextBadge.addr === tokenAddr)
      this.setState({ badge: nextBadge, fetching: false })
    else if (!fetching) {
      this.setState({ fetching: true })
      fetchBadge(tokenAddr)
    }
  }

  componentDidUpdate() {
    const { match } = this.props
    const { badge, fetching, evidenceListenerSet } = this.state
    const { tokenAddr } = match.params
    if (badge && badge.addr !== tokenAddr && !fetching) window.reload(true)

    if (badge && !evidenceListenerSet && badge.addr === tokenAddr) {
      arbitrableAddressList.events
        .Evidence({
          fromBlock: 0,
          filter: {
            _evidenceGroupID: badge.latestRequest.evidenceGroupID
          }
        })
        .on('data', async e => {
          const { badge } = this.state
          if (!badge) return
          const { latestRequest } = badge

          if (latestRequest.evidenceGroupID !== e.returnValues._evidenceGroupID)
            return

          const evidence = await (await fetch(
            `${IPFS_URL}${e.returnValues._evidence}`
          )).json()
          /* eslint-disable unicorn/number-literal-case */
          const calculatedMultihash = archon.utils.multihashFile(
            evidence,
            0x1b // keccak-256
          )

          if (
            !(await Archon.utils.validateFileFromURI(
              `${IPFS_URL}${e.returnValues._evidence}`,
              { hash: calculatedMultihash }
            ))
          ) {
            console.warn('Invalid evidence', evidence)
            return
          }

          const { evidences } = this.state
          const mimeType = mime.lookup(evidence.fileTypeExtension)
          evidence.icon = getFileIcon(mimeType)
          this.setState({
            evidences: {
              ...evidences,
              [e.transactionHash]: evidence
            }
          })
        })
      this.setState({ evidenceListenerSet: true })
    }
  }

  render() {
    const {
      evidences,
      countdownCompleted,
      appealModalOpen,
      loserCountdownCompleted,
      winnerCountdownCompleted,
      badge,
      evidencePeriodEnded
    } = this.state

    const { accounts, filter, match, arbitrableAddressListData } = this.props
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

    let userIsLoser
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
        userIsLoser = true
      else if (
        userAccount === latestRequest.parties[tcrConstants.SIDE.Challenger] &&
        latestRequest.dispute.ruling === tcrConstants.RULING_OPTIONS.Accept
      )
        userIsLoser = true

      if (latestRequest.dispute.ruling !== tcrConstants.RULING_OPTIONS.None) {
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
      userIsLoser,
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
      if (!latestRound.hasPaid[1])
        requesterFeesPercent =
          (Number(latestRound.paidFees[1]) /
            Number(latestRound.requiredForSide[1])) *
          100
      else requesterFeesPercent = 100

      if (!latestRound.hasPaid[2])
        challengerFeesPercent =
          (Number(latestRound.paidFees[2]) /
            Number(latestRound.requiredForSide[2])) *
          100
      else challengerFeesPercent = 100

      if (decisiveRuling) {
        if (latestRequest.dispute.ruling === tcrConstants.RULING_OPTIONS.Accept)
          loserPercent = challengerFeesPercent
        else loserPercent = requesterFeesPercent

        if (loserPercent < 100 && loserCountdownCompleted) loserTimedOut = true
      }
    }

    let periodRemainingTime = 0
    if (latestRequest.dispute)
      if (latestRequest.dispute.period.toString() === '1') {
        periodRemainingTime =
          Number(latestRequest.dispute.lastPeriodChange) * 1000 +
          Number(latestRequest.dispute.court.timesPerPeriod[1]) * 1000 +
          Number(latestRequest.dispute.court.timesPerPeriod[2]) * 1000 -
          Date.now()
      } else {
        periodRemainingTime =
          Number(latestRequest.dispute.lastPeriodChange) * 1000 +
          Number(
            latestRequest.dispute.court.timesPerPeriod[
              latestRequest.dispute.period
            ]
          ) *
            1000 -
          Date.now()
      }

    /* eslint-disable react/jsx-no-bind */

    return (
      <div className="Page">
        <FilterBar
          filter={filters}
          handleFilterChange={this.handleFilterChange}
        />
        <div
          style={{ display: 'flex', flexDirection: 'row', overflowX: 'auto' }}
        >
          <h4 style={{ marginLeft: 0, marginRight: 0, minWidth: '247px' }}>
            Badge Details
          </h4>
          <div className="TokenDetails-divider" />
          {badge.token ? (
            <Link
              to={`/token/${badge.token.ID}`}
              className="BadgeDetails-token"
            >
              <Img
                className="BadgeDetails-header-img"
                src={`${
                  badge.token
                    ? badge.token.symbolMultihash[0] === '/'
                      ? `${IPFS_URL}${badge.token.symbolMultihash}`
                      : `${FILE_BASE_URL}/${badge.token.symbolMultihash}`
                    : UnknownToken
                }`}
              />
              <h4 className="BadgeDetails-label-name">{badge.token.name}</h4>
              <h4 className="BadgeDetails-label-ticker">
                {badge.token.ticker}
              </h4>
            </Link>
          ) : (
            <div
              className="BadgeDetails-token"
              data-tip="There is no accepted token submission for this address on the T²CR"
            >
              <Img className="BadgeDetails-header-img" src={UnknownToken} />
              <h4 className="BadgeDetails-label-name">Unknown Token</h4>
            </div>
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
                    To be eligible to receive the badge, the project and it's
                    associated token must comply with listing criterion as
                    specified{' '}
                    <a
                      className="TokenDetails-withdraw"
                      target="_blank"
                      rel="noopener noreferrer"
                      href={ETHFINEX_CRITERIA_URL}
                      style={{ margin: 0, textDecoration: 'underline' }}
                    >
                      here.
                    </a>
                  </p>
                </div>
                <div
                  style={{
                    display: 'flex',
                    marginTop: 'auto',
                    width: '100%',
                    alignItems: 'flex-start'
                  }}
                >
                  {latestRequest.dispute &&
                    Number(latestRequest.dispute.status) ===
                      tcrConstants.DISPUTE_STATUS.Appealable &&
                    !latestRequest.latestRound.appealed && (
                      <span
                        className="BadgeDetails-meta--aligned BadgeDetails-timer"
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          color: '#3d464d',
                          fontSize: '14px',
                          marginRight: '14px'
                        }}
                        data-tip={
                          latestRequest.dispute.ruling.toString() !== '0'
                            ? ''
                            : `If the requester does not fully fund, the badge will ${
                                badge.status.toString() === '2'
                                  ? 'not be added'
                                  : 'not be removed'
                              } and parties will be reimbursed.`
                        }
                      >
                        <FontAwesomeIcon
                          className="BadgeDetails-icon"
                          color={tcrConstants.STATUS_COLOR_ENUM[5]}
                          icon="balance-scale"
                          style={{ marginRight: '10px' }}
                        />
                        {latestRequest.dispute.ruling.toString() !== '0'
                          ? rulingMessage(
                              decisiveRuling,
                              SIDE !== tcrConstants.SIDE.None,
                              userIsLoser,
                              latestRequest.dispute.ruling.toString()
                            )
                          : 'Jurors did not rule.'}
                      </span>
                    )}
                  {latestRequest.dispute &&
                    Number(latestRequest.dispute.period) <= 2 && (
                      <span
                        className="TokenDetails-meta-item"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          color: '#f60c36'
                        }}
                      >
                        <div className="BadgeDetails-timer">
                          <FontAwesomeIcon
                            className="TokenDetails-icon"
                            color="#f60c36"
                            icon="clock"
                          />
                          {evidencePeriodEnded ? (
                            'Waiting Next Period'
                          ) : (
                            <>
                              {`${
                                tcrConstants.PERIOD_STRINGS[
                                  latestRequest.dispute.period
                                ]
                              }`}
                              <Countdown
                                date={Date.now() + periodRemainingTime}
                                renderer={CountdownRenderer}
                                onStart={() =>
                                  this.onEvidenceCountdownComplete(
                                    periodRemainingTime
                                  )
                                }
                                onComplete={this.onEvidenceCountdownComplete}
                              />
                            </>
                          )}
                        </div>
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
                        !countdownCompleted)) && (
                      <>
                        {!latestRequest.disputed && !latestRequest.dispute ? (
                          <>
                            {!countdownCompleted && (
                              <span
                                style={{
                                  display: 'flex',
                                  alignItems: 'center'
                                }}
                              >
                                <div
                                  className="BadgeDetails-timer"
                                  style={{ fontSize: '14px', color: '#f60c36' }}
                                >
                                  <FontAwesomeIcon
                                    className="BadgeDetails-icon"
                                    color="#f60c36"
                                    icon="clock"
                                  />
                                  {'Challenge Deadline '}
                                  <Countdown
                                    onStart={() =>
                                      this.onCountdownComplete(time)
                                    }
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
                                {!decisiveRuling ? (
                                  <span
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      margin: '5px 5px 5px auto',
                                      fontSize: '14px'
                                    }}
                                  >
                                    <div
                                      className="BadgeDetails-timer"
                                      style={{
                                        display: 'flex',
                                        color: '#f60c36'
                                      }}
                                    >
                                      <FontAwesomeIcon
                                        className="BadgeDetails-icon"
                                        color="#f60c36"
                                        icon="clock"
                                      />
                                      <div>
                                        {'Appeal Deadline '}
                                        <Countdown
                                          date={Date.now() + time}
                                          renderer={CountdownRenderer}
                                          onStart={() =>
                                            this.onCountdownComplete(time)
                                          }
                                          onComplete={this.onCountdownComplete}
                                        />
                                      </div>
                                    </div>
                                  </span>
                                ) : (
                                  <>
                                    {!loserTimedOut && (
                                      <>
                                        <span
                                          style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            margin: '5px 5px 5px auto',
                                            fontSize: '14px'
                                          }}
                                        >
                                          <div
                                            className="BadgeDetails-timer"
                                            style={{
                                              display: 'flex',
                                              color: '#f60c36'
                                            }}
                                          >
                                            <FontAwesomeIcon
                                              className="BadgeDetails-icon"
                                              color="#f60c36"
                                              icon="clock"
                                            />
                                            <div>
                                              {'Winner Deadline '}
                                              <Countdown
                                                date={
                                                  Date.now() +
                                                  winnerRemainingTime
                                                }
                                                renderer={CountdownRenderer}
                                                onStart={() => {
                                                  this.onWinnerCountdownComplete(
                                                    winnerRemainingTime
                                                  )
                                                }}
                                                onComplete={
                                                  this.onWinnerCountdownComplete
                                                }
                                              />
                                            </div>
                                          </div>
                                        </span>
                                        <span
                                          style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            margin: '5px 5px 5px auto',
                                            fontSize: '14px'
                                          }}
                                        >
                                          <div
                                            className="BadgeDetails-timer"
                                            style={{
                                              display: 'flex',
                                              color: '#f60c36'
                                            }}
                                          >
                                            <FontAwesomeIcon
                                              className="BadgeDetails-icon"
                                              color="#f60c36"
                                              icon="clock"
                                            />
                                            <div>
                                              {'Loser Deadline '}
                                              <Countdown
                                                date={
                                                  Date.now() +
                                                  loserRemainingTime
                                                }
                                                renderer={CountdownRenderer}
                                                onComplete={
                                                  this.onLoserCountdownComplete
                                                }
                                                onStart={() => {
                                                  this.onLoserCountdownComplete(
                                                    loserRemainingTime
                                                  )
                                                }}
                                              />
                                            </div>
                                          </div>
                                        </span>
                                      </>
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
              {Number(badge.status) > 1 &&
                latestRequest.dispute &&
                Number(latestRequest.dispute.status) ===
                  tcrConstants.DISPUTE_STATUS.Appealable &&
                latestRequest.numberOfRounds > 1 &&
                (!decisiveRuling || !loserTimedOut) && (
                  <div
                    className="TokenDetails-meta"
                    style={{ margin: 0, marginRight: '26px' }}
                    data-tip="If the party that lost the previous round is fully funded but the winner is not, the loser will win the dispute."
                  >
                    <span style={{ color: '#009aff', marginBottom: '7px' }}>
                      <FontAwesomeIcon
                        color="#009aff"
                        icon="coins"
                        style={{ marginRight: '14px' }}
                      />
                      <strong>Fee Crowdfunding:</strong>
                    </span>
                    <span>Requester</span>
                    <Progress
                      className="TokenDetails-meta-item"
                      completed={requesterFeesPercent}
                      height="5px"
                      color={
                        requesterFeesPercent === 100 ? '#7ed9ff' : '#009aff'
                      }
                      style={{
                        width: '170px',
                        border: '1px solid #009aff',
                        borderColor:
                          requesterFeesPercent === 100 ? '#7ed9ff' : '#009aff',
                        borderRadius: '3px',
                        marginLeft: 0
                      }}
                    />
                    <span>Challenger</span>
                    <Progress
                      className="TokenDetails-meta-item"
                      completed={challengerFeesPercent}
                      height="5px"
                      color={
                        challengerFeesPercent === 100 ? '#7ed9ff' : '#009aff'
                      }
                      style={{
                        width: '170px',
                        border: '1px solid #009aff',
                        borderColor:
                          challengerFeesPercent === 100 ? '#7ed9ff' : '#009aff',
                        borderRadius: '3px',
                        marginLeft: 0
                      }}
                    />
                  </div>
                )}
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
                  userFriendlyLabel[
                    tcrConstants.BADGE_STATUS_ENUM[badge.clientStatus]
                  ]
                )}
              </span>
              <div className="BadgeDetails-meta" style={{ marginLeft: '14px' }}>
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
                      <div style={{ marginRight: '14px' }}>
                        {truncateMiddle(
                          web3.utils.toChecksumAddress(tokenAddr)
                        )}
                      </div>
                    </div>
                  </a>
                </span>
              </div>
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
                        ? (winnerCountdownCompleted &&
                            loserCountdownCompleted) ||
                          loserTimedOut
                        : countdownCompleted
                    }
                  >
                    <FontAwesomeIcon
                      className="BadgeDetails-icon"
                      icon="coins"
                    />
                    {(decisiveRuling
                    ? (!winnerCountdownCompleted || !loserCountdownCompleted) &&
                      !loserTimedOut
                    : !countdownCompleted)
                      ? 'Contribute Fees'
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
                    isBadge: true,
                    decisiveRuling,
                    loserPercent,
                    loserCountdownCompleted
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
                {latestRequest.disputed &&
                  (evidences ? (
                    <>
                      {Object.keys(evidences).map(key => (
                        <div
                          className="TokenDescription-evidence--item"
                          key={key}
                          onClick={this.handleViewEvidenceClick(evidences[key])}
                        >
                          <FontAwesomeIcon
                            icon={evidences[key].icon}
                            size="2x"
                          />
                        </div>
                      ))}
                    </>
                  ) : (
                    <div>
                      <BeatLoader color="#3d464d" />
                      <small>
                        <i>
                          Evidence can take some time to load. Thanks for the
                          patience
                        </i>
                      </small>
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
        {(!decisiveRuling || !loserTimedOut) && (
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
