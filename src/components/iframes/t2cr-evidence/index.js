import React, { Component } from 'react'
import { Link } from 'react-router-dom'

import ArbitrableTokenList from '../../../assets/contracts/arbitrable-token-list.json'
import { eth, FILE_BASE_URL } from '../../../bootstrap/dapp-api'

import './t2cr-evidence.css'

class TTCREvidence extends Component {
  state = { token: null }

  async componentDidMount() {
    const message = JSON.parse(
      window.location.search.substring(1).replace(/%22/g, '"')
    )

    if (!message || !message.arbitrableContractAddress || !message.disputeID)
      return

    const arbitrableTokenList = eth
      .contract(ArbitrableTokenList.abi)
      .at(message.arbitrableContractAddress)

    const ID = await arbitrableTokenList.disputeIDToTokenID(message.disputeID)
    const token = await arbitrableTokenList.getTokenInfo(ID[0])
    token.ID = ID[0]
    this.setState({ token })
  }

  onImgError = e => {
    e.target.style.display = 'none'
  }

  render() {
    const { token } = this.state
    if (!token) return null

    const symbolURI = `${FILE_BASE_URL}/${token.symbolMultihash}`
    return (
      <div className="TTCREvidence">
        <h4 style={{ marginLeft: 0 }}>The Token in Question:</h4>
        <div className="TTCREvidence-data">
          <img className="TTCREvidence-symbol" src={symbolURI} alt="Avatar" />
          <div className="TTCREvidence-data-card">
            <div
              className="TTCREvidence-container"
              style={{ overflowX: 'initial' }}
            >
              <p className="TTCREvidence-container-name">
                <b>{token.name}</b>
              </p>
              <p className="TTCREvidence-container-ticker">{token.ticker}</p>
            </div>
            <div className="TTCREvidence-data-separator" />
            <div className="TTCREvidence-container">
              <p className="TTCREvidence-container-multiline TTCREvidence-label">
                Address
              </p>
              <p className="TTCREvidence-container-multiline TTCREvidence-value">
                {token.addr}
              </p>
              <Link className="TTCREvidence-link" to={`/token/${token.ID}`}>
                <p
                  className="TTCREvidence-container-multiline"
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

export default TTCREvidence
