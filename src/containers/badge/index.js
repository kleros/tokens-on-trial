import React, { PureComponent } from 'react'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import * as mime from 'mime-types'
import { BeatLoader } from 'react-spinners'
import Archon from '@kleros/archon'

import { IPFS_URL, onlyInfura } from '../../bootstrap/dapp-api'
import Button from '../../components/button'
import Modal from '../../components/modal'
import Evidence from '../../components/evidence'
import FilterBar from '../filter-bar'
import { getRemainingTime } from '../../utils/ui'
import { getFileIcon } from '../../utils/evidence'
import * as filterActions from '../../actions/filter'
import * as filterSelectors from '../../reducers/filter'
import * as badgeActions from '../../actions/badge'
import * as modalActions from '../../actions/modal'
import * as modalConstants from '../../constants/modal'
import * as tcrConstants from '../../constants/tcr'
import * as walletSelectors from '../../reducers/wallet'
import * as arbitrableAddressListSelectors from '../../reducers/arbitrable-address-list'
import { ContractsContext } from '../../bootstrap/contexts'
import WithdrawFundsButton from '../../components/withdraw-funds'
import CrowdfundingCard from '../crowdfunding-card'

import BadgeDetailsCard from './badge-details-card'
import TokenInfo from './token-info'

import './badge.css'

class BadgeDetails extends PureComponent {
  static propTypes = {
    // State
    filter: filterSelectors.filterShape.isRequired,
    accounts: walletSelectors.accountsShape.isRequired,
    arbitrableAddressListData:
      arbitrableAddressListSelectors.arbitrableAddressListDataShape.isRequired,
    badge: PropTypes.shape({}),
    envObjects: PropTypes.shape({}).isRequired,
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

  static contextType = ContractsContext

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
    const { toggleFilter, match } = this.props
    const { badgeAddr } = match
    const { badgeViewContracts } = this.context
    const arbitrableAddressListView = badgeViewContracts[badgeAddr]

    toggleFilter(key, arbitrableAddressListView)
  }

  handleActionClick = (action, param) => {
    const { openActionModal } = this.props
    openActionModal(action, param)
  }

  fundAppeal = () => {
    this.setState({ appealModalOpen: true })
  }

  handleExecuteRequestClick = (badgeContractAddr, tokenAddr) => {
    const { timeout, openActionModal } = this.props
    openActionModal(modalConstants.ACTION_MODAL_ENUM.TxPending)
    timeout({ badgeContractAddr, tokenAddr })
  }

  handleFeesTimeoutClick = () => {
    const { timeout, badge, openActionModal } = this.props
    openActionModal(modalConstants.ACTION_MODAL_ENUM.TxPending)
    timeout(badge)
  }

  handleOpenEvidenceModal = badgeContractAddr => {
    const { openActionModal } = this.props
    openActionModal(modalConstants.ACTION_MODAL_ENUM.SubmitEvidenceBadge, {
      badgeContractAddr
    })
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
    const { withdrawBadgeFunds, badge, openActionModal, match } = this.props
    const { badgeAddr, tokenAddr } = match.params
    openActionModal(modalConstants.ACTION_MODAL_ENUM.TxPending)
    withdrawBadgeFunds({
      badgeContractAddr: badgeAddr,
      tokenAddr,
      item: badge
    })
  }

  submitBadgeAction = () =>
    this.handleActionClick(modalConstants.ACTION_MODAL_ENUM.SubmitBadge)

  componentDidMount() {
    const { match, fetchBadge } = this.props
    const { tokenAddr, badgeAddr } = match.params
    this.setState({ fetching: true })
    fetchBadge(tokenAddr, badgeAddr)
  }

  componentWillReceiveProps(nextProps) {
    const { badge: nextBadge } = nextProps
    const { match, fetchBadge } = this.props
    const { fetching } = this.state
    const { tokenAddr, badgeAddr } = match.params
    if (nextBadge && nextBadge.tokenAddress === tokenAddr)
      this.setState({ badge: nextBadge, fetching: false })
    else if (!fetching) {
      this.setState({ fetching: true })
      fetchBadge(tokenAddr, badgeAddr)
    }
  }

  async componentDidUpdate() {
    if (!this.context) return

    const {
      arbitratorEvents,
      archon,
      badgeEventsContracts,
      badgeViewContracts
    } = this.context

    const { match } = this.props
    const { tokenAddr, badgeAddr } = match.params
    const { fetchBadge, arbitrableAddressListData } = this.props
    const { data: badgeTCRs } = arbitrableAddressListData
    if (
      arbitrableAddressListData.loading ||
      !badgeTCRs ||
      !badgeTCRs[badgeAddr]
    )
      return

    const badgeContractBlockNumber = badgeTCRs[badgeAddr].blockNumber
    const arbitrableAddressListEvents = badgeEventsContracts[badgeAddr]
    const arbitrableAddressListView = badgeViewContracts[badgeAddr]
    const { badge, fetching, evidenceListenerSet } = this.state
    if (
      !fetching &&
      badge &&
      evidenceListenerSet &&
      badge.tokenAddress !== tokenAddr
    ) {
      fetchBadge(tokenAddr, badgeAddr)
      this.setState({
        fetching: true,
        evidenceListenerSet: false,
        evidences: null
      })
      return
    }

    if (
      fetching ||
      (badge && evidenceListenerSet && badge.tokenAddress === tokenAddr)
    )
      return

    if (!badge && !fetching) {
      fetchBadge(tokenAddr, badgeAddr)
      return
    }

    if (!badge && fetching) return
    if (badge && badge.tokenAddress !== tokenAddr && !fetching)
      window.location.reload(true)

    if (evidenceListenerSet) return

    const { latestRequest } = badge

    if (badge && !evidenceListenerSet) {
      arbitrableAddressListEvents.events.RewardWithdrawal((err, event) => {
        if (err) {
          console.error(err)
          return
        }
        const { tokenAddr } = match.params
        if (tokenAddr === event.returnValues._address)
          fetchBadge(tokenAddr, badgeAddr)
      })
      arbitrableAddressListEvents.events.AddressStatusChange((err, event) => {
        if (err) {
          console.error(err)
          return
        }
        const { tokenAddr } = match.params
        if (tokenAddr === event.returnValues._address)
          fetchBadge(tokenAddr, badgeAddr)
      })
      arbitratorEvents.events.AppealPossible((err, event) => {
        if (err) {
          console.error(err)
          return
        }
        const { badge } = this.state
        if (!badge) return
        const { latestRequest } = badge

        if (
          latestRequest.disputeID === Number(event.returnValues._disputeID) ||
          latestRequest.appealDisputeID ===
            Number(event.returnValues._disputeID)
        )
          fetchBadge(tokenAddr, badgeAddr)
      })
      arbitrableAddressListEvents.events.Ruling((err, event) => {
        if (err) {
          console.error(err)
          return
        }
        const { badge } = this.state
        if (!badge) return
        const { latestRequest } = badge
        if (
          latestRequest.disputed &&
          (latestRequest.disputeID === Number(event.returnValues._disputeID) ||
            latestRequest.appealDisputeID ===
              Number(event.returnValues._disputeID))
        )
          fetchBadge(tokenAddr, badgeAddr)
      })
      arbitrableAddressListEvents.events.Evidence(async (err, e) => {
        if (err) {
          console.error(err)
          return
        }
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
            [e.transactionHash]: {
              ...evidence,
              blockNumber: e.blockNumber
            }
          }
        })
      })
    }

    await Promise.all(
      (await arbitrableAddressListView.getPastEvents('Evidence', {
        filter: {
          _evidenceGroupID: badge.latestRequest.evidenceGroupID
        },
        fromBlock: badgeContractBlockNumber,
        toBlock: 'latest'
      })).map(async e => {
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
            [e.transactionHash]: {
              ...evidence,
              blockNumber: e.blockNumber
            }
          }
        })
      })
    )

    this.setState({ evidenceListenerSet: true })
  }

  render() {
    const {
      evidences,
      appealModalOpen,
      loserCountdownCompleted,
      badge
    } = this.state

    const {
      accounts,
      filter,
      match,
      arbitrableAddressListData,
      envObjects
    } = this.props

    const { tokenAddr, badgeAddr } = match.params
    if (
      !badge ||
      badge.tokenAddress !== tokenAddr ||
      !this.context ||
      !arbitrableAddressListData
    )
      return (
        <div className="Page Page--loading">
          <BeatLoader color="#3d464d" />
        </div>
      )

    const { badgeViewContracts } = this.context
    const arbitrableAddressListView = badgeViewContracts[badgeAddr]
    const FILE_BASE_URL = envObjects ? envObjects.FILE_BASE_URL : null
    const { filters } = filter

    const missingTCRdata =
      !arbitrableAddressListData ||
      !arbitrableAddressListData.data ||
      !arbitrableAddressListData.data[badgeAddr]

    if (badge.numberOfRequests === 0 || missingTCRdata)
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

    let decisiveRuling
    let requesterIsLoser
    let challengerIsLoser
    const { latestRequest } = badge
    if (
      latestRequest.dispute &&
      Number(latestRequest.dispute.status) ===
        tcrConstants.DISPUTE_STATUS.Appealable &&
      !latestRequest.latestRound.appealed
    )
      if (latestRequest.dispute.ruling !== tcrConstants.RULING_OPTIONS.None) {
        decisiveRuling = true
        requesterIsLoser =
          latestRequest.dispute.ruling === tcrConstants.RULING_OPTIONS.Refuse
        challengerIsLoser =
          latestRequest.dispute.ruling === tcrConstants.RULING_OPTIONS.Accept
      }

    const loserRemainingTime = getRemainingTime(
      badge,
      arbitrableAddressListData,
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

    /* eslint-disable react/jsx-no-bind */

    return (
      <div className="Page">
        <FilterBar
          filter={filters}
          handleFilterChange={this.handleFilterChange}
        />
        <div className="BadgeDetails-header">
          <h4 className="BadgeDetails-header-title">Badge Details</h4>
          <div
            className="BadgeDetails-header-divider"
            style={{ height: '30px' }}
          />
          <TokenInfo badge={badge} FILE_BASE_URL={FILE_BASE_URL} />
          <WithdrawFundsButton
            onWithdrawFundsClick={this.withdrawFunds}
            item={badge}
          />
        </div>
        <BadgeDetailsCard
          badge={badge}
          FILE_BASE_URL={FILE_BASE_URL}
          userAccount={accounts.data[0]}
          tcr={arbitrableAddressListView}
          tcrData={arbitrableAddressListData.data[badgeAddr]}
          handleActionClick={this.handleActionClick}
          handleExecuteRequestClick={() =>
            this.handleExecuteRequestClick(badgeAddr, tokenAddr)
          }
          fundAppeal={this.fundAppeal}
        />
        <br />
        <CrowdfundingCard
          item={badge}
          userAccount={accounts.data[0]}
          tcrData={arbitrableAddressListData.data[badgeAddr]}
          fundAppeal={this.fundAppeal}
          handleActionClick={this.handleActionClick}
          badgeContractAddr={badgeAddr}
        />
        <Evidence
          item={badge}
          evidences={evidences}
          handleOpenEvidenceModal={this.handleOpenEvidenceModal}
          handleViewEvidenceClick={this.handleViewEvidenceClick}
        />
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
                    modalConstants.ACTION_MODAL_ENUM['FundAppealBadge'],
                    {
                      side: tcrConstants.SIDE.Requester,
                      badgeContractAddr: badgeAddr
                    }
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
                    modalConstants.ACTION_MODAL_ENUM['FundAppealBadge'],
                    {
                      side: tcrConstants.SIDE.Challenger,
                      badgeContractAddr: badgeAddr
                    }
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
    filter: state.filter,
    envObjects: state.envObjects.data
  }),
  {
    openActionModal: modalActions.openActionModal,
    fetchBadge: badgeActions.fetchBadge,
    timeout: badgeActions.timeout,
    withdrawBadgeFunds: badgeActions.withdrawBadgeFunds,
    toggleFilter: filterActions.toggleFilter
  }
)(BadgeDetails)
