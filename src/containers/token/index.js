import React, { PureComponent } from 'react'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import Img from 'react-image'

import EtherScanLogo from '../../assets/images/etherscan.png'
import Button from '../../components/button'
import FilterBar from '../filter-bar'
import { defaultFilter } from '../../utils/filter'
import * as tokenActions from '../../actions/token'

import './token.css'

class TokenDetails extends PureComponent {
  static propTypes = {
    fetchToken: PropTypes.func.isRequired,
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
                <Button type="primary">
                  <FontAwesomeIcon icon="gavel" className="TokenDetails-icon" />
                  Challenge Registry
                </Button>
              </div>
            </div>
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
  state => ({ token: state.token.token.data }),
  { fetchToken: tokenActions.fetchToken }
)(TokenDetails)
