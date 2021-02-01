import React from 'react'
import metaMaskLogo from '../../assets/images/meta-mask-logo.png'
import './incorrect-network.css'

const IncorrectNetwork = () => (
  <div className="IncorrectNetwork">
    <img
      alt="MetaMask Logo"
      className="IncorrectNetwork-logo"
      src={metaMaskLogo}
    />
    <div className="IncorrectNetwork-content">
      <h1>Wrong Metamask network configuration.</h1>
      <p>
        Please ensure Metamask is set to the either the <strong>Main</strong>{' '}
        Ethereum network or the <strong>Kovan</strong> testnet.
      </p>
    </div>
  </div>
)

export default IncorrectNetwork
