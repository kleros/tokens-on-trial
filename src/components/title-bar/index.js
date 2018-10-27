import React from 'react'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'

import Button from '../button'

import './title-bar.css'

export default () => (
  <div className="TitleBar">
    <h3 className="TitleBar-title">Token² Curated Registry</h3>
    <Button type="primary" size="normal" className="TitleBar-submitToken">
      <FontAwesomeIcon icon="plus" className="TitleBar-submitToken-icon" />
      Submit a Token
    </Button>
  </div>
)
