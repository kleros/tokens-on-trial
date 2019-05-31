import React from 'react'
import PropTypes from 'prop-types'

import Acropolis from '../../assets/images/acropolis.svg'

import './page-not-found.css'

const PageNotFound = ({
  type = 404,
  title = 'Oops,',
  msg = 'Page not found',
  small
}) => (
  <div className="PageNotFound">
    <img src={Acropolis} style={{ width: '100%' }} alt="acropolis" />
    <div className="PageNotFound-message">
      <h1
        style={{
          color: '#009aff',
          fontSize: '88px',
          fontWeight: 'bold',
          lineHeight: '112px',
          margin: 0
        }}
      >
        {type}
      </h1>
      <h2
        style={{
          margin: '12px',
          color: '#4004a3',
          fontSize: '28px',
          fontWeight: 'bold'
        }}
      >
        {title}
      </h2>
      <small>
        <h3
          style={{
            margin: 0,
            color: '#4004a3',
            fontSize: '24px',
            fontWeight: 400
          }}
        >
          {msg}
        </h3>
        <h4
          style={{
            margin: 0,
            color: '#4004a3',
            fontWeight: 400,
            fontSize: '16px',
            marginTop: '25px'
          }}
        >
          {small}
        </h4>
      </small>
    </div>
  </div>
)

PageNotFound.propTypes = {
  type: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  title: PropTypes.string,
  msg: PropTypes.string,
  small: PropTypes.string
}

PageNotFound.defaultProps = {
  type: 404,
  title: 'Oops,',
  msg: 'Page not found',
  small: null
}

export default PageNotFound
