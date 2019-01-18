import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { pushRotate as ReactBurgerMenu } from 'react-burger-menu'

import logo from '../../assets/images/kleros-logo.png'
import './nav-bar.css'

export default class NavBar extends PureComponent {
  static propTypes = {
    // State
    routes: PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.node.isRequired,
        isExternal: PropTypes.bool
      }).isRequired
    ).isRequired,
    extras: PropTypes.arrayOf(PropTypes.node.isRequired).isRequired
  }

  state = {
    isMobile: document.body.clientWidth < 780
  }

  render() {
    const { routes, extras } = this.props
    const { isMobile } = this.state

    const logoImg = <img alt="Logo" className="NavBar-logo" src={logo} />
    const routesAndExtras = [
      ...routes.map(r => (
        <div key={r.title}>
          <Link
            className={`NavBar-route ${r.extraStyle}`}
            style={{ height: '55px', verticalAlign: 'center' }}
            to="/"
          >
            {r.title}
          </Link>
        </div>
      )),
      ...extras.map((e, i) => (
        <div
          className={`NavBar-extra ${isMobile ? 'is-mobile' : ''} ${
            i === 0 ? 'NavBar-extra--first' : ''
          }`}
          key={i}
        >
          {e}
        </div>
      ))
    ]
    return (
      <div className="NavBar">
        <Link to="/">{logoImg}</Link>
        {isMobile ? (
          <ReactBurgerMenu
            className="NavBar-burgerMenu"
            customBurgerIcon={<div />}
            customCrossIcon={logoImg}
            itemListClassName="NavBar-burgerMenu-itemList"
            outerContainerId="router-root"
            overlayClassName="NavBar-burgerMenu-overlay"
            pageWrapId="scroll-root"
          >
            {routesAndExtras}
          </ReactBurgerMenu>
        ) : (
          routesAndExtras
        )}
      </div>
    )
  }
}
