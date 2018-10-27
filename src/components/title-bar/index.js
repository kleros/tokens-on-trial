import React from 'react'

import Button from '../button'

import './topbar.css'

export default () => (
  <div className="Topbar">
    <h3 className="Topbar-title">Token² Curated Registry</h3>
    <Button type="primary" size="small" className="Topbar-submitToken">
      + Submit Token
    </Button>
  </div>
)
