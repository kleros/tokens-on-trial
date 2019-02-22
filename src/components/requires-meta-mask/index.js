import React from 'react'
import PropTypes from 'prop-types'

import metaMaskLogo from '../../assets/images/meta-mask-logo.png'
import Button from '../button'
import './requires-meta-mask.css'

const RequiresMetamask = ({
  requiredNetwork,
  metamaskNetwork,
  needsMetamask
}) => (
  <div className="RequiresMetamask">
    <img
      alt="MetaMask Logo"
      className="RequiresMetamask-logo"
      src={metaMaskLogo}
    />
    <div className="RequiresMetamask-content">
      {needsMetamask ? (
        <>
          <h1>You need a Web3 enabled browser to run this dapp.</h1>
          <small>
            We recommend using Chrome with the MetaMask extension. This also
            serves as your login so you won't need to keep track of another
            account and password.
          </small>
          <div>
            <br />
            <Button to="https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn?hl=en">
              Install MetaMask
            </Button>
          </div>
        </>
      ) : (
        <>
          <h1>Wrong Metamask network configuration.</h1>
          <p>
            Please ensure Metamask is set to the{' '}
            <strong>{requiredNetwork}</strong> ethereum network
          </p>
          <small>
            Metamask is currently set to the {metamaskNetwork} ethereum network
          </small>
        </>
      )}
    </div>
  </div>
)

RequiresMetamask.propTypes = {
  requiredNetwork: PropTypes.string.isRequired,
  metamaskNetwork: PropTypes.string.isRequired,
  needsMetamask: PropTypes.bool.isRequired
}

export default RequiresMetamask
