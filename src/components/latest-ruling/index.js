import React from 'react'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import PropTypes from 'prop-types'

import * as tcrConstants from '../../constants/tcr'
import { rulingMessage, getItemInformation } from '../../utils/ui'
import { itemShape } from '../../reducers/generic-shapes'

import './latest-ruling.css'

const LatestRuling = ({ item, userAccount }) => {
  const { latestRequest } = item
  const { dispute, latestRound } = latestRequest
  const { appealed } = latestRound
  const disputeStatus = dispute ? dispute.status : null
  const ruling = dispute ? dispute.ruling : null

  if (disputeStatus !== tcrConstants.DISPUTE_STATUS.Appealable || appealed)
    return null

  const { userSide, userIsLoser, decisiveRuling } = getItemInformation(
    item,
    userAccount
  )

  return (
    <span
      className="LatestRuling-timer LatestRuling-meta-item"
      style={{
        display: 'flex',
        alignItems: 'center',
        color: '#3d464d'
      }}
      data-tip={
        ruling.toString() === '0'
          ? `If the requester does not fully fund, the token will ${
              item.status.toString() === '2' ? 'not be added' : 'not be removed'
            } and parties will be reimbursed.`
          : ''
      }
    >
      <FontAwesomeIcon
        className="LatestRuling-icon"
        color={tcrConstants.STATUS_COLOR_ENUM[5]}
        icon="balance-scale"
        style={{ marginRight: '10px' }}
      />
      {ruling.toString() === '0'
        ? 'Jurors did not rule.'
        : rulingMessage(
            decisiveRuling,
            userSide !== tcrConstants.SIDE.None,
            userIsLoser,
            ruling.toString()
          )}
    </span>
  )
}

LatestRuling.propTypes = {
  item: itemShape.isRequired,
  userAccount: PropTypes.string.isRequired
}

export default LatestRuling
