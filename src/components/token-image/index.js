import React from 'react'
import PropTypes from 'prop-types'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'

import * as tokenConstants from '../../constants/token'

import './token-image.css'

const TokenImage = ({ status, imageSrc }) => {
  let icon
  switch (status) {
    case tokenConstants.STATUS_ENUM.Pending:
      break
    case tokenConstants.STATUS_ENUM.Challenged:
      icon = 'question'
      break
    case tokenConstants.STATUS_ENUM.Accepted:
      icon = 'check'
      break
    case tokenConstants.STATUS_ENUM.Rejected:
      icon = 'times'
      break
    default:
      break
  }

  return (
    <div
      className={`TokenImage TokenImage--${tokenConstants.STATUS_ENUM[
        status
      ].toLowerCase()}`}
    >
      <img src={imageSrc} alt="Token Submission" className="TokenImage-image" />
      {icon && (
        <FontAwesomeIcon
          icon={icon}
          className="TokenImage-icon"
          data-tip={tokenConstants.STATUS_ENUM[status]}
        />
      )}
    </div>
  )
}

TokenImage.propTypes = {
  // State
  status: PropTypes.oneOf(tokenConstants.STATUS_ENUM.indexes).isRequired,
  imageSrc: PropTypes.string.isRequired
}

export default TokenImage
