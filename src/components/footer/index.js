import React from 'react'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'

import './footer.css'

const Footer = () => (
  <footer className="Footer">
    <div>
      <a className="Footer-link" href="https://kleros.io">
        Find out more about kleros
      </a>
    </div>
    <div>
      <a className="Footer-link" href="/">
        Kleros · T²CR
      </a>
    </div>
    <div>
      <a className="Footer-link" href="https://t.me/kleros">
        <FontAwesomeIcon
          className="Footer-icon"
          size="lg"
          icon={['fab', 'telegram']}
          color="white"
        />
      </a>
      <a className="Footer-link" href="https://github.com/kleros">
        <FontAwesomeIcon
          className="Footer-icon"
          size="lg"
          icon={['fab', 'github']}
          color="white"
        />
      </a>
      <a className="Footer-link" href="https://blog.kleros.io">
        <FontAwesomeIcon
          className="Footer-icon"
          size="lg"
          icon="bullhorn"
          color="white"
        />
      </a>
      <a className="Footer-link" href="https://twitter.com/kleros_io">
        <FontAwesomeIcon
          className="Footer-icon"
          size="lg"
          icon={['fab', 'twitter']}
          color="white"
        />
      </a>
    </div>
  </footer>
)

export default Footer
