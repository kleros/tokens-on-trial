import React from 'react'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import PropTypes from 'prop-types'

import * as tcrConstants from '../../constants/tcr'
import { userFriendlyLabel, toSentenceCase } from '../../utils/ui'

import './item-status.css'

const ItemStatus = ({
  item: {
    clientStatus,
    latestRequest: { disputeID, disputed, resolved }
  }
}) => (
  <span
    className="ItemStatus-meta-item"
    style={{ color: tcrConstants.STATUS_COLOR_ENUM[clientStatus] }}
  >
    <FontAwesomeIcon
      className="ItemStatus-icon"
      color={tcrConstants.STATUS_COLOR_ENUM[clientStatus]}
      icon={tcrConstants.STATUS_ICON_ENUM[clientStatus]}
    />
    <div style={{ fontSize: '14px' }}>
      {disputed && !resolved ? (
        <a
          href={`https://court.kleros.io/cases/${disputeID}`}
          style={{ color: 'inherit' }}
        >
          {userFriendlyLabel[tcrConstants.STATUS_ENUM[clientStatus]]} - #
          {disputeID}
        </a>
      ) : (
        toSentenceCase(
          userFriendlyLabel[tcrConstants.STATUS_ENUM[clientStatus]]
        )
      )}
    </div>
  </span>
)

ItemStatus.propTypes = {
  item: PropTypes.shape({
    clientStatus: PropTypes.number.isRequired
  }).isRequired
}

export default ItemStatus
