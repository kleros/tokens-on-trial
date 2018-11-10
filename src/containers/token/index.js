import React, { PureComponent } from 'react'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import Img from 'react-image'

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

import './token.css'

class TokenDetails extends PureComponent {
  static propTypes = {
    accounts: walletSelectors.accountsShape.isRequired,
    executeRequest: PropTypes.func.isRequired,
    fetchToken: PropTypes.func.isRequired,
    openTokenModal: PropTypes.func.isRequired,
    token: PropTypes.shape({
      tokenName: PropTypes.string,
      ticker: PropTypes.string,
      address: PropTypes.string,
      URI: PropTypes.string
    }),
    match: PropTypes.shape({
      params: PropTypes.shape({
        tokenID: PropTypes.string
      })
    })
  }

  static defaultProps = {
    match: {},
    token: null
  }

  state = {
    token: null,
    filter: defaultFilter()
  }

  handleFilterChange = key => {
    const { filter } = this.state
    filter[key] = !filter[key]
    this.setState({ filter })
  }

  handleClearTokenClick = () => {
    const { openTokenModal } = this.props
    openTokenModal(modalConstants.TOKEN_MODAL_ENUM.Clear)
  }

  handleExecuteRequestClick = () => {
    const { match, executeRequest } = this.props
    const { tokenID } = match.params
    executeRequest(tokenID)
  }

  getActionButton = (token, userAccount) => {
    let method, label, icon
    if (hasPendingRequest(token.status))
      if (token.latestAgreement.creator === userAccount) {
        method = this.handleExecuteRequestClick
        icon = 'check'
        if (isRegistrationRequest(token.status)) label = 'Confirm Registration'
        else label = 'Confirm Clearing'
      } else {
        icon = 'gavel'
        if (isRegistrationRequest(token.status))
          label = 'Challenge Registration'
        else label = 'Challenge Clearing'
      }
    else if (
      token.status === tokenConstants.IN_CONTRACT_STATUS_ENUM['Registered']
    ) {
      method = this.handleClearTokenClick
      label = 'Submit Clearing Request'
      icon = 'gavel'
    } else {
      label = 'Resubmit Token'
      icon = 'plus'
    }

    return (
      <Button type="primary" onClick={method}>
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
    const { token } = this.props
    this.setState({ token })
  }

  render() {
    const { token, filter } = this.state
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
                <span className="TokenDetails-label-name">
                  {token.tokenName}
                </span>
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
                    icon="hourglass-half"
                  />
                  Registration Requested
                </span>
                <div className="TokenDetails-timer">
                  Challenge Deadline 12:34:56
                </div>
              </div>
              <div className="TokenDetails-action">
                {this.getActionButton(token, accounts.data[0])}
              </div>
            </div>
          </div>
          <div className="TokenDescription">
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
    accounts: state.wallet.accounts
  }),
  {
    fetchToken: tokenActions.fetchToken,
    executeRequest: tokenActions.executeRequest,
    openTokenModal: modalActions.openTokenModal
  }
)(TokenDetails)
