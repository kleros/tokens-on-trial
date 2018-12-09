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
    extras: PropTypes.arrayOf(PropTypes.node.isRequired).isRequired
  }

  state = {
    isMobile: document.body.clientWidth < 780
  }

  constructor(props) {
    super(props)
    window.addEventListener('resize', this.handleWindowResize)
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleWindowResize)
  }

  handleWindowResize = debounce(({ currentTarget: { innerWidth } }) =>
    this.setState({ isMobile: innerWidth < 780 })
  )

  render() {
    const { routes, extras } = this.props
    const { isMobile } = this.state

    const logoImg = <img src={logo} alt="Logo" className="NavBar-logo" />
    const routesAndExtras = [
      ...routes.map(r => (
        <div key={r.title}>
          <Link
            to={`/`}
            className={`NavBar-route ${r.extraStyle}`}
            style={{ height: '55px', verticalAlign: 'center' }}
          >
            {r.title}
          </Link>
        </div>
      )),
      ...extras.map((e, i) => (
        <div
          key={i}
          className={`NavBar-extra ${isMobile ? 'is-mobile' : ''} ${
            i === 0 ? 'NavBar-extra--first' : ''
          }`}
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
            pageWrapId="scroll-root"
            outerContainerId="router-root"
            customBurgerIcon={<div />}
            customCrossIcon={logoImg}
            className="NavBar-burgerMenu"
            itemListClassName="NavBar-burgerMenu-itemList"
            overlayClassName="NavBar-burgerMenu-overlay"
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
