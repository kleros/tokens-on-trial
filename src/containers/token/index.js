import React, { PureComponent } from 'react'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import Img from 'react-image'
import * as mime from 'mime-types'
import { BeatLoader } from 'react-spinners'
import Countdown from 'react-countdown-now'

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
import Modal from '../../components/modal'
import FilterBar from '../filter-bar'
import CountdownRenderer from '../../components/countdown-renderer'
import { hasPendingRequest } from '../../utils/tcr'
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
    evidences: [],
    countdownCompleted: false,
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
    const { match, fetchToken, accounts } = this.props
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
      )
        fetchToken(tokenID)
    })
    arbitrableTokenList.events.RewardWithdrawal().on('data', event => {
      const { token } = this.state
      if (!token || event.returnValues._beneficiary !== accounts.data[0]) return
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
    arbitrableTokenList.events.Evidence({ fromBlock: 0 }).on('data', e => {
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
      .on('data', e => {
        const { token } = this.state
        if (!token) return

        if (e.returnValues._tokenID === tokenID) fetchToken(tokenID)
      })
  }

  withdrawFunds = () => {
    const { withdrawTokenFunds, token } = this.props
    withdrawTokenFunds({ ID: token.ID, request: token.numberOfRequests - 1 })
  }

  fundAppeal = () => {
    this.setState({ appealModalOpen: true })
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

  submitBadgeAction = () =>
    this.handleActionClick(modalConstants.ACTION_MODAL_ENUM.SubmitBadge)

  componentWillReceiveProps(nextProps) {
    const { token } = nextProps
    if (token) this.setState({ token })
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

    if (token.ID !== tokenID) return window.location.reload()

    let losingSide
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
      token,
      arbitrableTokenListData,
      tcrConstants,
      losingSide,
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
    if (latestRequest) latestRound = latestRequest.latestRound

    return (
      <div className="Page">
        <FilterBar
          filter={filters}
          handleFilterChange={this.handleFilterChange}
        />
        <div style={{ display: 'flex', flexDirection: 'row' }}>
          <h4 style={{ marginLeft: 0 }}>Token Details</h4>
          {token.latestRequest.withdrawable > 0 && (
            <>
              <div className="TokenDetails-divider" />
              <h5
                className="TokenDetails-withdraw"
                onClick={this.withdrawFunds}
              >
                <span className="TokenDetails-withdraw-value">
                  {Number(
                    web3.utils.fromWei(latestRequest.withdrawable.toString())
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
                    {token.addr ? truncateMiddle(token.addr) : ''}
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
              {latestRequest.dispute &&
                Number(latestRequest.dispute.status) ===
                  tcrConstants.DISPUTE_STATUS.Appealable &&
                !latestRound.appealed && (
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
                    {tcrConstants.RULING_OPTIONS[latestRequest.dispute.ruling]}{' '}
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
                  (latestRequest.dispute.status ===
                    tcrConstants.DISPUTE_STATUS.Appealable.toString() &&
                    time > 0)) && (
                  <>
                    {!latestRequest.dispute ? (
                      <>
                        {time > 0 && !countdownCompleted && (
                          <span
                            style={{ display: 'flex', alignItems: 'center' }}
                          >
                            <div className="BadgeDetails-timer">
                              <FontAwesomeIcon
                                className="TokenDetails-icon"
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
                                  alignItems: 'center'
                                }}
                              >
                                <div className="BadgeDetails-timer">
                                  <FontAwesomeIcon
                                    className="TokenDetails-icon"
                                    color={tcrConstants.STATUS_COLOR_ENUM[4]}
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
                                      margin: '0'
                                    }}
                                  >
                                    <div className="BadgeDetails-timer">
                                      <FontAwesomeIcon
                                        className="TokenDetails-icon"
                                        color={
                                          tcrConstants.STATUS_COLOR_ENUM[4]
                                        }
                                        icon="clock"
                                      />
                                      {'Winner Appeal Deadline '}
                                      <Countdown
                                        date={Date.now() + winnerRemainingTime}
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
                                        margin: '0'
                                      }}
                                    >
                                      <div className="BadgeDetails-timer">
                                        <FontAwesomeIcon
                                          className="TokenDetails-icon"
                                          color={
                                            tcrConstants.STATUS_COLOR_ENUM[4]
                                          }
                                          icon="clock"
                                        />
                                        {'Loser Appeal Deadline '}
                                        <Countdown
                                          date={Date.now() + loserRemainingTime}
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
                      ? winnerCountdownCompleted && loserCountdownCompleted
                      : countdownCompleted
                  }
                >
                  <FontAwesomeIcon className="TokenDetails-icon" icon="gavel" />
                  {(decisiveRuling
                  ? !winnerCountdownCompleted || !loserCountdownCompleted
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
                  handleExecuteRequestClick: this.handleExecuteRequestClick
                })
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
          <br />
          <Button
            className="Appeal-request"
            type="primary"
            style={{ marginRight: '12px' }}
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
        </Modal>
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
