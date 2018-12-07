import React from 'react'
import PropTypes from 'prop-types'

import './nav-overlay.css'

const NavOverlay = ({ onClick }) => (
  <div className="NavOverlay" onClick={onClick} />
)

NavOverlay.propTypes = {
  onClick: PropTypes.func.isRequired
}

export default NavOverlay
