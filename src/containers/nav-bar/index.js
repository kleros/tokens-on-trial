import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { slide as ReactBurgerMenu } from 'react-burger-menu'
import debounce from 'debounce'
import T2CRLogo from '../../assets/images/t2cr-logo.png'
import { onlyInfura } from '../../bootstrap/dapp-api'
import './nav-bar.css'

export default class NavBar extends PureComponent {
  static propTypes = {
    // State
    routes: PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.node.isRequired,
        isExternal: PropTypes.bool,
      }).isRequired
    ).isRequired,
    submenus: PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.node.isRequired,
      }).isRequired
    ).isRequired,
    extras: PropTypes.arrayOf(PropTypes.node.isRequired).isRequired,
    action: PropTypes.node.isRequired,
  }

  state = {
    isMobile: document.body.clientWidth < 950,
    isOpen: false,
  }

  constructor(props) {
    super(props)
    window.addEventListener('resize', this.handleWindowResize)
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleWindowResize)
  }

  handleWindowResize = debounce(({ currentTarget }) => {
    const { innerWidth } = currentTarget || {}
    if (innerWidth) this.setState({ isMobile: innerWidth < 950 })
  })

  handleStateChange(state) {
    const { isOpen } = state
    this.setState({ isOpen })
  }

  closeMenu = () => {
    this.setState({ isOpen: false })
  }

  render() {
    const { routes, extras, submenus, action } = this.props
    const { isMobile, isOpen } = this.state

    const logoImg = <img alt="Logo" className="NavBar-logo" src={T2CRLogo} />
    const routesAndExtras = [
      ...routes.map((r) => (
        <div key={r.title}>
          {r.isExternal ? (
            <a
              className={`NavBar-route ${r.extraStyle}`}
              style={{ height: '55px' }}
              onClick={this.closeMenu}
              href={r.to}
              rel="noopener noreferrer"
              target="_blank"
            >
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                {r.title}
                <i style={{ fontSize: '10px', letterSpacing: 0 }}>
                  {r.subtitle}
                </i>
              </div>
            </a>
          ) : (
            <Link
              className={`NavBar-route ${r.extraStyle}`}
              style={{ height: '55px' }}
              onClick={this.closeMenu}
              to={r.to}
            >
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                {r.title}
                <i style={{ fontSize: '10px', letterSpacing: 0 }}>
                  {r.subtitle}
                </i>
              </div>
            </Link>
          )}
        </div>
      )),
      ...submenus.map((s) =>
        !isMobile ? (
          <div
            key={s.key}
            className={`NavBar-route ${s.extraStyle} NavBar-submenu`}
          >
            {s.title}
            <ul className="NavBar-submenu-list">
              {s.routes.map((r) => (
                <a
                  className={`NavBar-route ${r.extraStyle} NavBar-submenu-item`}
                  style={{ height: '55px' }}
                  rel="noopener noreferrer"
                  target="_blank"
                  href={r.to}
                  key={r.title}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    {r.title}
                    <i style={{ fontSize: '10px', letterSpacing: 0 }}>
                      {r.subtitle}
                    </i>
                  </div>
                </a>
              ))}
            </ul>
          </div>
        ) : (
          s.routes.map((r) => (
            <div key={r.title}>
              <a
                className={`NavBar-route ${r.extraStyle}`}
                style={{ height: '55px' }}
                rel="noopener noreferrer"
                target="_blank"
                href={r.to}
                key={r.to}
              >
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  {r.title}
                  <i style={{ fontSize: '10px', letterSpacing: 0 }}>
                    {r.subtitle}
                  </i>
                </div>
              </a>
            </div>
          ))
        )
      ),
      ...extras
        .filter(() => !isMobile)
        .map((e, i) => (
          <div
            key={i}
            className={`NavBar-extra ${i === 0 ? 'NavBar-extra--first' : ''}`}
          >
            {e}
          </div>
        )),
      <div
        style={{ marginLeft: '20px', width: '135px' }}
        onClick={onlyInfura ? null : this.closeMenu}
        key="navbar-action"
      >
        {action}
      </div>,
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
                alignSelf: 'center',
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
            onStateChange={(state) => this.handleStateChange(state)}
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
