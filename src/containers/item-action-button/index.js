import React from 'react'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import PropTypes from 'prop-types'

import Button from '../../components/button'
import getActionButton from '../../components/action-button'
import * as tcrConstants from '../../constants/tcr'
import { getItemInformation } from '../../utils/ui'
import { onlyInfura } from '../../bootstrap/dapp-api'
import { itemShape, tcrShape } from '../../reducers/generic-shapes'

const ItemActionButton = ({
  item,
  userAccount,
  fundAppeal,
  handleActionClick,
  handleExecuteRequestClick,
  tcr,
  countdownCompleted,
  appealPeriodEnded,
  loserTimedOut,
  extraClass,
  badgeContractAddr
}) => {
  const { status, latestRequest } = item
  const { dispute } = latestRequest

  const { userSide, decisiveRuling, loserPercent } = getItemInformation(
    item,
    userAccount
  )

  return (
    <div className={`TokenDetails-action ${extraClass || ''}`}>
      {status > 1 &&
      dispute &&
      dispute.status === tcrConstants.DISPUTE_STATUS.Appealable &&
      userSide === tcrConstants.SIDE.None ? (
        <Button
          type="primary"
          onClick={fundAppeal}
          tooltip={onlyInfura ? 'Please install MetaMask.' : null}
          disabled={
            onlyInfura ||
            (decisiveRuling
              ? (appealPeriodEnded && loserTimedOut) || loserTimedOut
              : countdownCompleted)
          }
        >
          <FontAwesomeIcon className="TokenDetails-icon" icon="coins" />
          {(decisiveRuling
          ? (!appealPeriodEnded || !loserTimedOut) && !loserTimedOut
          : !countdownCompleted)
            ? 'Fund Appeal'
            : 'Waiting Enforcement'}
        </Button>
      ) : (
        getActionButton({
          item,
          userAccount,
          tcr,
          countdownCompleted,
          handleActionClick: handleActionClick,
          handleExecuteRequestClick: handleExecuteRequestClick,
          decisiveRuling,
          loserPercent,
          loserTimedOut,
          badgeContractAddr
        })
      )}
    </div>
  )
}

ItemActionButton.propTypes = {
  item: itemShape.isRequired,
  userAccount: PropTypes.string.isRequired,
  fundAppeal: PropTypes.func.isRequired,
  handleActionClick: PropTypes.func.isRequired,
  handleExecuteRequestClick: PropTypes.func.isRequired,
  tcr: tcrShape.isRequired,
  appealPeriodEnded: PropTypes.bool.isRequired,
  countdownCompleted: PropTypes.bool.isRequired,
  loserTimedOut: PropTypes.bool.isRequired,
  extraClass: PropTypes.string,
  badgeContractAddr: PropTypes.string.isRequired
}

ItemActionButton.defaultProps = {
  extraClass: ''
}

export default ItemActionButton
