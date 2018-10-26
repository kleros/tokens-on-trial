import React from 'react'
import PropTypes from 'prop-types'

import RequiresMetaMask from '../../components/requires-meta-mask'
import Button from '../../components/button'

import './requires-meta-mask-page.css'

const RequiresMetaMaskPage = ({ needsUnlock }) => (
  <div className="RequiresMetaMaskPage">
    <RequiresMetaMask needsUnlock={needsUnlock} />
    <div className="RequiresMetaMaskPage-FAQ">
      <h1>Still have questions? Don't worry, we're here to help!</h1>
      <Button
        to="mailto:stuart@kleros.io?Subject=Tokens%20on%20Trial%20Support"
        type="ternary"
        className="RequiresMetaMaskPage-card-button"
      >
        Contact Support
      </Button>
      <Button
        to="https://t.me/kleros"
        type="ternary"
        className="RequiresMetaMaskPage-card-button"
      >
        Ask in Telegram
      </Button>
    </div>
  </div>
)

RequiresMetaMaskPage.propTypes = {
  // State
  needsUnlock: PropTypes.bool.isRequired
}

export default RequiresMetaMaskPage
