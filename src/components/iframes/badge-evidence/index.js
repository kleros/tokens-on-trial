import React, { Component } from 'react'
import { Link } from 'react-router-dom'

import ArbitrableAddressList from '../../../assets/contracts/arbitrable-address-list.json'
import { eth } from '../../../bootstrap/dapp-api'

import './badge-evidence.css'

class BadgeEvidence extends Component {
  state = {
    badgeAddress: null,
    tokenAddress: null
  }

  async componentDidMount() {
    const message = JSON.parse(
      window.location.search.substring(1).replace(/%22/g, '"')
    )

    if (!message || !message.arbitrableContractAddress || !message.disputeID)
      return

    const arbitrableAddressList = eth
      .contract(ArbitrableAddressList.abi)
      .at(message.data.arbitrableContractAddress)

    const tokenAddress = (await arbitrableAddressList.disputeIDToAddress(
      message.data.disputeID
    ))[0]
    this.setState({
      tokenAddress,
      badgeAddress: message.data.arbitrableContractAddress
    })
  }

  onImgError = e => {
    e.target.style.display = 'none'
  }

  render() {
    const { tokenAddress, badgeAddress } = this.state
    if (!tokenAddress || !badgeAddress) return null

    return (
      <div className="BadgeEvidence">
        <h4 style={{ marginLeft: 0 }}>The Token in Question:</h4>
        <div className="BadgeEvidence-data">
          <div className="BadgeEvidence-data-card">
            <div className="BadgeEvidence-container">
              <p className="BadgeEvidence-container-multiline BadgeEvidence-label">
                Token Address
              </p>
              <p className="BadgeEvidence-container-multiline BadgeEvidence-value">
                {tokenAddress}
              </p>
              <br />
              <p className="BadgeEvidence-container-multiline BadgeEvidence-label">
                Badge Contract Address
              </p>
              <p className="BadgeEvidence-container-multiline BadgeEvidence-value">
                {badgeAddress}
              </p>
              <Link
                className="BadgeEvidence-link"
                to={`/badge/${badgeAddress}/${tokenAddress}`}
              >
                <p
                  className="BadgeEvidence-container-multiline"
                  style={{ marginTop: '10px' }}
                >
                  View Submission
                </p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default BadgeEvidence
