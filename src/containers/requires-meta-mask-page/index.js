import React from 'react'
import PropTypes from 'prop-types'

import RequiresMetaMask from '../../components/incorrect-network'
import Button from '../../components/button'

import './requires-meta-mask-page.css'

const RequiresMetaMaskPage = ({
  metamaskNetwork,
  requiredNetwork,
  needsMetamask
}) => (
  <div className="RequiresMetaMaskPage">
    <RequiresMetaMask
      metamaskNetwork={metamaskNetwork}
      requiredNetwork={requiredNetwork}
      needsMetamask={needsMetamask}
    />
    <div className="RequiresMetaMaskPage-FAQ">
      <h1>Still have questions? Don't worry, we're here to help!</h1>
      <Button
        className="RequiresMetaMaskPage-card-button"
        to="mailto:stuart@kleros.io?Subject=Tokens%20on%20Trial%20Support"
        type="ternary"
      >
        Contact Support
      </Button>
      <Button
        className="RequiresMetaMaskPage-card-button"
        to="https://t.me/kleros"
        type="ternary"
      >
        Ask in Telegram
      </Button>
    </div>
  </div>
)

RequiresMetaMaskPage.propTypes = {
  metamaskNetwork: PropTypes.string,
  requiredNetwork: PropTypes.string,
  needsMetamask: PropTypes.bool.isRequired
}

RequiresMetaMaskPage.defaultProps = {
  metamaskNetwork: '',
  requiredNetwork: ''
}

export default RequiresMetaMaskPage
