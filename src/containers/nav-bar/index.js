import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { slide as ReactBurgerMenu } from 'react-burger-menu'
import debounce from 'debounce'

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
    extraRoutes: PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.node.isRequired
      }).isRequired
    ).isRequired,
    extras: PropTypes.arrayOf(PropTypes.node.isRequired).isRequired,
    action: PropTypes.node.isRequired
  }

  state = {
    isMobile: document.body.clientWidth < 1010,
    isOpen: false
  }

  constructor(props) {
    super(props)
    window.addEventListener('resize', this.handleWindowResize)
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleWindowResize)
  }

  handleWindowResize = debounce(({ currentTarget: { innerWidth } }) =>
    this.setState({ isMobile: innerWidth < 1010 })
  )

  handleStateChange(state) {
    const { isOpen } = state
    this.setState({ isOpen })
  }

  closeMenu = () => {
    this.setState({ isOpen: false })
  }

  render() {
    const { routes, extras, extraRoutes, action } = this.props
    const { isMobile, isOpen } = this.state

    const logoImg = <img alt="Logo" className="NavBar-logo" src={logo} />
    const routesAndExtras = [
      ...routes.map(r => (
        <div key={r.title}>
          <Link
            className={`NavBar-route ${r.extraStyle}`}
            style={{ height: '55px' }}
            to={r.to}
            onClick={this.closeMenu}
          >
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              {r.title}
              <i style={{ fontSize: '10px', letterSpacing: 0 }}>{r.subtitle}</i>
            </div>
          </Link>
        </div>
      )),
      ...extraRoutes.map(r => (
        <div key={r.title}>
          <a
            className={`NavBar-route ${r.extraStyle}`}
            style={{ height: '55px' }}
            rel="noopener noreferrer"
            target="_blank"
            href={r.to}
          >
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              {r.title}
              <i style={{ fontSize: '10px', letterSpacing: 0 }}>{r.subtitle}</i>
            </div>
          </a>
        </div>
      )),
      ...extras.map((e, i) => (
        <div key={i}>
          {!isMobile && (
            <div
              className={`NavBar-extra ${i === 0 ? 'NavBar-extra--first' : ''}`}
            >
              {e}
            </div>
          )}
        </div>
      )),
      <div
        style={{ marginLeft: '20px', width: '135px' }}
        onClick={this.closeMenu}
        key="navbar-action"
      >
        {action}
      </div>
    ]
    return (
      <div className="NavBar">
        {!isMobile && <Link to="/">{logoImg}</Link>}
        {isMobile && (
          <>
            <span className="NavBar-hamburger" />
            <span
              style={{
                color: 'white',
                marginLeft: '14px',
                fontSize: '16px',
                alignSelf: 'center'
              }}
            >
              K L E R O S
            </span>
          </>
        )}
        {/* eslint-disable react/jsx-no-bind */}
        {isMobile ? (
          <ReactBurgerMenu
            className="NavBar-burgerMenu"
            isOpen={isOpen}
            onStateChange={state => this.handleStateChange(state)}
            itemListClassName="NavBar-burgerMenu-itemList"
            overlayClassName="NavBar-burgerMenu-overlay"
            customBurgerIcon={<div />}
            customCrossIcon={logoImg}
            outerContainerId="router-root"
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
