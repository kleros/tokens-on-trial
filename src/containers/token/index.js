import React, { PureComponent } from 'react'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import Img from 'react-image'
import * as mime from 'mime-types'
import { BeatLoader } from 'react-spinners'
import Countdown from 'react-countdown-now'
import Progress from 'react-progressbar'
import Archon from '@kleros/archon'

import {
  arbitrableTokenList,
  arbitrableAddressList,
  arbitrator,
  web3,
  archon,
  FILE_BASE_URL,
  IPFS_URL
} from '../../bootstrap/dapp-api'
import EtherScanLogo from '../../assets/images/etherscan.png'
import Button from '../../components/button'
import BadgeCard from '../../components/badge-card'
import Modal from '../../components/modal'
import FilterBar from '../filter-bar'
import CountdownRenderer from '../../components/countdown-renderer'
import { hasPendingRequest } from '../../utils/tcr'
import {
  getRemainingTime,
  getBadgeStyle,
  rulingMessage,
  userFriendlyLabel
} from '../../utils/ui'
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
    badges: PropTypes.shape({}).isRequired,

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
    evidences: null,
    countdownCompleted: false,
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

  handleViewEvidenceClick = evidence => () => {
    const { openActionModal } = this.props
    openActionModal(modalConstants.ACTION_MODAL_ENUM.ViewEvidence, evidence)
  }

  toSentenceCase = input => {
    input = input ? input.toLowerCase() : ''
    return input.charAt(0).toUpperCase() + input.slice(1)
  }

  componentDidMount() {
    const { match, fetchToken, accounts } = this.props
    const { tokenID } = match.params
    fetchToken(tokenID)
    arbitrableTokenList.events.Ruling().on('data', event => {
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
    arbitrableTokenList.events.RewardWithdrawal().on('data', event => {
      const { token } = this.state
      if (
        !token ||
        event.returnValues._beneficiary !== accounts.data[0] ||
        token.ID !== event.returnValues._tokenID
      )
        return
      fetchToken(event.returnValues._tokenID)
    })
    arbitrableTokenList.events.TokenStatusChange().on('data', event => {
      const { token } = this.state
      if (!token) return

      if (tokenID === event.returnValues._tokenID) fetchToken(tokenID)
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
      )
        fetchToken(tokenID)
    })
    arbitrableAddressList.events.AddressStatusChange().on('data', event => {
      const { token } = this.state
      if (!token) return

      if (token.addr === event.returnValues._address) fetchToken(tokenID)
    })
    arbitrableTokenList.events.TokenStatusChange().on('data', event => {
      const { token } = this.state
      if (!token) return

      if (tokenID === event.returnValues._tokenID) fetchToken(tokenID)
    })
  }

  withdrawFunds = () => {
    const { withdrawTokenFunds, token, openActionModal } = this.props
    openActionModal(modalConstants.ACTION_MODAL_ENUM.TxPending)
    withdrawTokenFunds({ ID: token.ID, item: token })
  }

  fundAppeal = () => {
    this.setState({ appealModalOpen: true })
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

  submitBadgeAction = () =>
    this.handleActionClick(modalConstants.ACTION_MODAL_ENUM.SubmitBadge)

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

  componentDidUpdate() {
    const { match } = this.props
    const { token, fetching, evidenceListenerSet } = this.state
    const { tokenID } = match.params
    if (token && token.ID !== tokenID && !fetching) window.location.reload(true)

    if (token && !evidenceListenerSet && token.ID === tokenID) {
      arbitrableTokenList.events
        .Evidence({
          fromBlock: 0,
          filter: {
            _evidenceGroupID: token.latestRequest.evidenceGroupID
          }
        })
        .on('data', async e => {
          const { token } = this.state
          if (!token) return
          const { latestRequest } = token

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
          )
            return

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
      token,
      evidencePeriodEnded
    } = this.state

    const {
      accounts,
      filter,
      match,
      arbitrableTokenListData,
      badges
    } = this.props
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
        <div className="PageNotFound">
          <div className="PageNotFound-message">
            404.
            <br />
            <small>
              <h3>Token not found.</h3>
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
    const { latestRequest } = token

    const SIDE =
      userAccount === latestRequest.parties[tcrConstants.SIDE.Requester]
        ? tcrConstants.SIDE.Requester
        : userAccount === latestRequest.parties[tcrConstants.SIDE.Challenger]
        ? tcrConstants.SIDE.Challenger
        : tcrConstants.SIDE.None

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
      token,
      arbitrableTokenListData,
      tcrConstants,
      userIsLoser,
      decisiveRuling
    )

    const loserRemainingTime = getRemainingTime(
      token,
      arbitrableTokenListData,
      tcrConstants,
      true,
      decisiveRuling
    )

    const winnerRemainingTime = getRemainingTime(
      token,
      arbitrableTokenListData,
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
        <div style={{ display: 'flex', flexDirection: 'row' }}>
          <h4 style={{ marginLeft: 0 }}>Token Details</h4>
          {token.withdrawable.gt(web3.utils.toBN(0)) && (
            <>
              <div className="TokenDetails-divider" />
              <h5
                className="TokenDetails-withdraw"
                onClick={this.withdrawFunds}
              >
                <span className="TokenDetails-withdraw-value">
                  {Number(
                    web3.utils.fromWei(token.withdrawable.toString())
                  ).toFixed(4)}{' '}
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
            src={`${
              token.symbolMultihash && token.symbolMultihash[0] === '/'
                ? `${IPFS_URL}`
                : `${FILE_BASE_URL}/`
            }${token.symbolMultihash}`}
          />
          <div className="TokenDetails-card">
            <div className="TokenDetails-card-content">
              <div className="TokenDetails-label">
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    marginLeft: '38px',
                    alignSelf: 'flex-start'
                  }}
                >
                  <span className="TokenDetails-label-name">{token.name}</span>
                  <span className="TokenDetails-label-ticker">
                    {token.ticker}
                  </span>
                </div>
              </div>
              <div className="TokenDetails-divider" />
              <div className="TokenDetails-meta">
                <span className="TokenDetails-meta-item">
                  <FontAwesomeIcon
                    className="TokenDetails-icon"
                    color={tcrConstants.STATUS_COLOR_ENUM[token.clientStatus]}
                    icon={tcrConstants.STATUS_ICON_ENUM[token.clientStatus]}
                  />
                  {this.toSentenceCase(
                    userFriendlyLabel[
                      tcrConstants.STATUS_ENUM[token.clientStatus]
                    ]
                  )}
                </span>
                {latestRequest.dispute &&
                  Number(latestRequest.dispute.status) ===
                    tcrConstants.DISPUTE_STATUS.Appealable &&
                  !latestRound.appealed && (
                    <span
                      className="BadgeDetails-timer TokenDetails-meta-item"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        color: '#3d464d'
                      }}
                      data-tip={
                        latestRequest.dispute.ruling.toString() !== '0'
                          ? ''
                          : `If the requester does not fully fund, the token will ${
                              token.status.toString() === '2'
                                ? 'not be added'
                                : 'not be removed'
                            } and parties will be reimbursed.`
                      }
                    >
                      <FontAwesomeIcon
                        className="TokenDetails-icon"
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
                  token.clientStatus <= 1 ||
                  (hasPendingRequest(token.status, latestRequest) &&
                    latestRequest.dispute &&
                    latestRequest.dispute.status !==
                      tcrConstants.DISPUTE_STATUS.Appealable.toString())
                ) &&
                  (!latestRequest.dispute ||
                    latestRequest.dispute.status ===
                      tcrConstants.DISPUTE_STATUS.Appealable.toString()) && (
                    <>
                      {!latestRequest.disputed && !latestRequest.dispute ? (
                        <>
                          {!countdownCompleted && (
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
                                {'Challenge Deadline '}
                                <Countdown
                                  date={Date.now() + time}
                                  renderer={CountdownRenderer}
                                  onComplete={this.onCountdownComplete}
                                  onStart={() => this.onCountdownComplete(time)}
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
                              {!decisiveRuling && !countdownCompleted ? (
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
                                    {'Appeal Deadline '}
                                    <Countdown
                                      date={Date.now() + time}
                                      renderer={CountdownRenderer}
                                      onComplete={this.onCountdownComplete}
                                      onStart={() =>
                                        this.onCountdownComplete(time)
                                      }
                                    />
                                  </div>
                                </span>
                              ) : (
                                <>
                                  {!loserTimedOut && (
                                    <>
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
                                          {'Winner Deadline '}
                                          <Countdown
                                            date={
                                              Date.now() + winnerRemainingTime
                                            }
                                            renderer={CountdownRenderer}
                                            onComplete={
                                              this.onWinnerCountdownComplete
                                            }
                                            onStart={() =>
                                              this.onWinnerCountdownComplete(
                                                winnerRemainingTime
                                              )
                                            }
                                          />
                                        </div>
                                      </span>
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
                                          {'Loser Deadline '}
                                          <Countdown
                                            date={
                                              Date.now() + loserRemainingTime
                                            }
                                            renderer={CountdownRenderer}
                                            onComplete={
                                              this.onLoserCoundownComplete
                                            }
                                            onStart={() => {
                                              this.onLoserCountdownComplete(
                                                loserRemainingTime
                                              )
                                            }}
                                          />
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
              {Number(token.status) > 1 &&
                latestRequest.dispute &&
                Number(latestRequest.dispute.status) ===
                  tcrConstants.DISPUTE_STATUS.Appealable &&
                latestRequest.numberOfRounds > 1 &&
                (!decisiveRuling || !loserTimedOut) && (
                  <div
                    className="TokenDetails-meta"
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
                        width: '200px',
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
                        width: '200px',
                        border: '1px solid #009aff',
                        borderColor:
                          challengerFeesPercent === 100 ? '#7ed9ff' : '#009aff',
                        borderRadius: '3px',
                        marginLeft: 0
                      }}
                    />
                  </div>
                )}
              <div className="TokenDetails-action">
                {Number(token.status) > 1 &&
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
                          !loserTimedOut
                        : countdownCompleted
                    }
                  >
                    <FontAwesomeIcon
                      className="TokenDetails-icon"
                      icon="coins"
                    />
                    {(decisiveRuling
                    ? (!winnerCountdownCompleted || !loserCountdownCompleted) &&
                      !loserTimedOut
                    : !countdownCompleted)
                      ? 'Fund Appeal'
                      : 'Waiting Enforcement'}
                  </Button>
                ) : (
                  getActionButton({
                    item: token,
                    userAccount,
                    tcr: arbitrableTokenListData,
                    countdownCompleted,
                    handleActionClick: this.handleActionClick,
                    handleExecuteRequestClick: this.handleExecuteRequestClick,
                    decisiveRuling,
                    loserPercent,
                    loserCountdownCompleted
                  })
                )}
              </div>
            </div>
            <div className="TokenDetails-footer">
              <a
                className="TokenDetails--link"
                style={{ marginRight: '14px' }}
                href={`https://etherscan.io/token/${token.addr}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Img
                  className="TokenDetails-icon TokenDetails-meta--aligned"
                  src={EtherScanLogo}
                />
                {token.addr ? web3.utils.toChecksumAddress(token.addr) : ''}
              </a>
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
                  <span>
                    <span
                      className="TokenDetails-icon-badge TokenDetails-meta--aligned"
                      style={getBadgeStyle(token.badge, tcrConstants)}
                    >
                      1
                    </span>
                    Badge
                  </span>
                )}
            </div>
          </div>
        </div>
        {latestRequest && !latestRequest.resolved && (
          <div className="TokenDescription">
            <hr className="TokenDescription-separator" />
            <h3>Evidence</h3>
            <div className="TokenDescription-evidence">
              <div className="TokenDescription-evidence--list">
                {evidences ? (
                  <>
                    {Object.keys(evidences).map(key => (
                      <div
                        className="TokenDescription-evidence--item"
                        key={key}
                        onClick={this.handleViewEvidenceClick(evidences[key])}
                      >
                        <FontAwesomeIcon icon={evidences[key].icon} size="2x" />
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
                )}
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
                <BadgeCard badge={badges[token.addr]} />
              )}
          </div>
        </div>
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
                disabled={
                  decisiveRuling &&
                  challengerIsLoser &&
                  (loserRemainingTime === 0 || loserCountdownCompleted)
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
  state => ({
    token: state.token.token.data,
    badges: state.badges.data.items,
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
