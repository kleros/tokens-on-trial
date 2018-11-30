import React, { PureComponent } from 'react'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import Img from 'react-image'

import { web3 } from '../../bootstrap/dapp-api'
import EtherScanLogo from '../../assets/images/etherscan.png'
import Button from '../../components/button'
import FilterBar from '../filter-bar'
import { defaultFilter } from '../../utils/filter'
import { hasPendingRequest, isRegistrationRequest } from '../../utils/token'
import * as tokenActions from '../../actions/token'
import * as modalActions from '../../actions/modal'
import * as modalConstants from '../../constants/modal'
import * as tokenConstants from '../../constants/token'
import * as walletSelectors from '../../reducers/wallet'
import * as arbitrableTokenListSelectors from '../../reducers/arbitrable-token-list'

import './token.css'

class TokenDetails extends PureComponent {
  static propTypes = {
    // State
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
    executeRequest: PropTypes.func.isRequired,
    fetchToken: PropTypes.func.isRequired,
    openTokenModal: PropTypes.func.isRequired,
    appealRuling: PropTypes.func.isRequired,
    feeTimeout: PropTypes.func.isRequired
  }

  static defaultProps = {
    match: {},
    token: null
  }

  state = {
    token: null,
    filter: defaultFilter(),
    timestamp: null,
    countdown: null
  }

  handleFilterChange = key => {
    const { filter } = this.state
    filter[key] = !filter[key]
    this.setState({ filter })
  }

  handleActionClick = action => {
    const { openTokenModal } = this.props
    openTokenModal(action)
  }

  handleExecuteRequestClick = () => {
    const { match, executeRequest } = this.props
    const { tokenID } = match.params
    executeRequest(tokenID)
  }

  handleFeeTimeoutClick = () => {
    const { feeTimeout, token } = this.props
    feeTimeout(token)
  }

  handleAppealRulingClick = () => {
    const { match, appealRuling, accounts, token } = this.props
    const { tokenID } = match.params
    const side =
      accounts.data[0] ===
      token.latestRequest.parties[tokenConstants.SIDE.Requester]
        ? tokenConstants.SIDE.Requester
        : tokenConstants.SIDE.Challenger

    appealRuling(tokenID, side)
  }

  getActionButton = (token, userAccount) => {
    const { arbitrableTokenListData } = this.props
    const { timestamp, countdown } = this.state
    const lastAction = Number(token.lastAction) / 1000 // convert from milliseconds
    let method
    let disabled = true
    let label = 'Loading...'
    let icon = 'spinner'

    if (!token || !arbitrableTokenListData.data)
      return (
        <Button type="primary" disabled={disabled}>
          <FontAwesomeIcon icon={icon} className="TokenDetails-icon" />
          {label}
        </Button>
      )

    const timeToChallenge = Number(arbitrableTokenListData.data.timeToChallenge)
    const arbitrationFeesWaitingTime = Number(
      arbitrableTokenListData.data.arbitrationFeesWaitingTime
    )
    const { latestRequest } = token
    const { latestRound, firstContributionTime } = latestRequest
    const submitterFees = latestRound.paidFees[tokenConstants.SIDE.Requester]
    const challengerFees =
      latestRound.paidFees[tokenConstants.SIDE.challengerFees]

    if (hasPendingRequest(token))
      if (latestRequest.disputed) {
        icon = 'hourglass-half'
        disabled = true
        label = 'Waiting Arbitration'
        if (
          latestRequest.dispute.status ===
          tokenConstants.DISPUTE_STATUS.Appealable
        ) {
          icon = 'gavel'
          disabled = false
          label = 'Appeal Ruling'
          method = this.handleAppealRuling
        }
      } else if (
        (submitterFees > 0 || challengerFees > 0) &&
        timestamp > firstContributionTime + arbitrationFeesWaitingTime
      ) {
        icon = 'gavel'
        disabled = false
        method = this.handleFeesTimeout
        if (submitterFees > challengerFees) label = 'Timeout Challenger'
        else label = 'Timeout Submitter'
      } else if (
        timestamp >= lastAction + timeToChallenge ||
        (countdown && countdown.getTime && countdown.getTime() === 0)
      ) {
        method = this.handleExecuteRequestClick
        icon = 'check'
        disabled = false
        label = 'Execute Request'
      } else if (
        latestRequest.parties[tokenConstants.SIDE.Requester] === userAccount
      ) {
        if (timestamp - firstContributionTime < arbitrationFeesWaitingTime) {
          icon = 'gavel'
          label = 'Pay Arbitration Fees'
          disabled = false
          method = () =>
            this.handleActionClick(modalConstants.TOKEN_MODAL_ENUM.FundDispute)
        } else {
          method = this.handleExecuteRequestClick
          icon = 'check'
          disabled =
            !timestamp ||
            !token ||
            !timeToChallenge ||
            timestamp <= lastAction + timeToChallenge
          if (isRegistrationRequest(token.status))
            label = 'Confirm Registration'
          else label = 'Confirm Clearing'
        }
      } else {
        icon = 'gavel'
        disabled = timestamp >= lastAction + timeToChallenge
        if (challengerFees > submitterFees) {
          label = 'Waiting Submitter Fees'
          disabled = true
        } else {
          method = () =>
            this.handleActionClick(modalConstants.TOKEN_MODAL_ENUM.Challenge)
          if (isRegistrationRequest(token.status))
            label = 'Challenge Registration'
          else label = 'Challenge Clearing'
        }
      }
    else {
      disabled = false
      if (
        token.status === tokenConstants.IN_CONTRACT_STATUS_ENUM['Registered']
      ) {
        method = () =>
          this.handleActionClick(modalConstants.TOKEN_MODAL_ENUM.Clear)
        label = 'Submit Clearing Request'
        icon = 'gavel'
      } else {
        label = 'Resubmit Token'
        icon = 'plus'
        method = () =>
          this.handleActionClick(modalConstants.TOKEN_MODAL_ENUM.Resubmit)
      }
    }

    return (
      <Button type="primary" onClick={method} disabled={disabled}>
        <FontAwesomeIcon icon={icon} className="TokenDetails-icon" />
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
    const { token, arbitrableTokenListData } = this.props
    this.setState({ token })

    const { countdown } = this.state
    if (
      token &&
      hasPendingRequest(token) &&
      countdown === null &&
      arbitrableTokenListData &&
      arbitrableTokenListData.data
    ) {
      this.setState({ countdown: 'Loading...' })
      web3.eth.getBlock('latest', (err, block) => {
        if (err) throw new Error(err)

        let time =
          Number(token.lastAction) +
          Number(arbitrableTokenListData.data.timeToChallenge) -
          block.timestamp * 1000
        time = time >= 0 ? time : 0
        this.setState({
          timestamp: block.timestamp,
          countdown: new Date(time)
        })
        setInterval(() => {
          const { countdown } = this.state
          if (countdown > 0)
            this.setState({ countdown: new Date(countdown - 1000) })
        }, 1000)
      })
    }
  }

  render() {
    const { token, filter, countdown } = this.state
    const { accounts } = this.props

    if (token)
      return (
        <div className="Page">
          <FilterBar
            filter={filter}
            handleFilterChange={this.handleFilterChange}
          />
          <div className="TokenDetails">
            <Img className="TokenDetails-img" src={token.URI} />
            <div className="TokenDetails-card">
              <div className="TokenDetails-label">
                <span className="TokenDetails-label-name">{token.name}</span>
                <span className="TokenDetails-label-ticker">
                  {token.ticker}
                </span>
              </div>
              <div className="TokenDetails-divider" />
              <div className="TokenDetails-meta">
                <div className="TokenDetails-meta--aligned">
                  <span>
                    <a
                      className="TokenDetails--link"
                      href={`https://etherscan.io/token/${token.address}`}
                    >
                      <Img
                        className="TokenDetails-icon TokenDetails-meta--aligned"
                        src={EtherScanLogo}
                      />
                      00a041...31ae
                    </a>
                  </span>
                </div>
                <div>
                  <span>
                    <span className="TokenDetails-icon-badge TokenDetails-meta--aligned">
                      1
                    </span>
                    Badges
                  </span>
                </div>
              </div>
              <div className="TokenDetails-meta">
                <span className="TokenDetails-meta--aligned">
                  <FontAwesomeIcon
                    className="TokenDetails-icon"
                    icon={
                      token.clientStatus === tokenConstants.STATUS_ENUM.Pending
                        ? 'hourglass-half'
                        : tokenConstants.STATUS_ICON_ENUM[token.clientStatus]
                    }
                  />
                  {tokenConstants.STATUS_ENUM[token.clientStatus]}
                </span>
                <div
                  className={`TokenDetails-timer ${
                    token.clientStatus !== tokenConstants.STATUS_ENUM.Pending ||
                    Number(countdown) === 0
                      ? `Hidden`
                      : ``
                  }`}
                >
                  Challenge Deadline{' '}
                  {countdown instanceof Date
                    ? countdown.toISOString().substr(11, 8)
                    : '--:--:--'}
                </div>
              </div>
              <div className="TokenDetails-action">
                {this.getActionButton(token, accounts.data[0])}
              </div>
            </div>
          </div>
          <div className="TokenDesiption">
            <hr className="TokenDescription-separator" />
            <h3>Description</h3>
            <p>
              Assumenda voluptates corporis dolorem inventore fuga possimus.
              Cupiditate aspernatur vero dolore quasi quasi. Ea sit aut
              excepturi quia facere ut voluptate. Consequuntur assumenda officia
              laudantium mollitia dolore. Fugiat iusto quis ducimus aut magnam
              quasi autem. Doloremque minus nulla aspernatur autem. Ea officia
              qui officiis. Consequatur harum nobis ab unde impedit quis. Odit
              error rem rerum corporis. Voluptates ullam placeat ab.
            </p>
          </div>
          <br />
          <div className="TokenDescription">
            <hr className="TokenDescription-separator" />
            <h3>Badges</h3>
            <span>
              <span className="TokenDescription--icon--badge TokenDetails-meta--aligned" />
              Compliant with YY
            </span>
          </div>
        </div>
      )
    else
      return (
        <div className="Page">
          <h5>Loading...</h5>
        </div>
      )
  }
}

export default connect(
  state => ({
    token: state.token.token.data,
    accounts: state.wallet.accounts,
    arbitrableTokenListData: state.arbitrableTokenList.arbitrableTokenListData
  }),
  {
    fetchToken: tokenActions.fetchToken,
    executeRequest: tokenActions.executeRequest,
    openTokenModal: modalActions.openTokenModal,
    appealRuling: tokenActions.appealRuling,
    feeTimeout: tokenActions.feeTimeout
  }
)(TokenDetails)
