import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { pushRotate as ReactBurgerMenu } from 'react-burger-menu'
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
    extras: PropTypes.arrayOf(PropTypes.node.isRequired).isRequired
  }

  state = {
    isMobile: document.body.clientWidth < 1010
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

  render() {
    const { routes, extras, extraRoutes } = this.props
    const { isMobile } = this.state

    const logoImg = <img alt="Logo" className="NavBar-logo" src={logo} />
    const routesAndExtras = [
      ...routes.map(r => (
        <div key={r.title}>
          <Link
            className={`NavBar-route ${r.extraStyle}`}
            style={{ height: '55px' }}
            to={r.to}
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
        <>
          {!isMobile && (
            <div
              className={`NavBar-extra ${isMobile ? 'is-mobile' : ''} ${
                i === 0 ? 'NavBar-extra--first' : ''
              }`}
              key={i}
            >
              {e}
            </div>
          )}
        </>
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
