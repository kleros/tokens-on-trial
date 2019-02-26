import React from 'react'
import PropTypes from 'prop-types'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'

import * as tokenSelectors from '../../../../reducers/token'
import * as tcrConstants from '../../../../constants/tcr'
import * as arbitrableTokenListSelectors from '../../../../reducers/arbitrable-token-list'
import * as arbitrableAddressListSelectors from '../../../../reducers/arbitrable-address-list'
import { web3 } from '../../../../bootstrap/dapp-api'
import Button from '../../../../components/button'
import './appeal.css'

const isLosingSide = (item, side) => {
  const { latestRequest } = item
  let losingSide = false
  if (
    Number(side) === tcrConstants.SIDE.Requester &&
    latestRequest.dispute.ruling === tcrConstants.RULING_OPTIONS.Refuse
  )
    losingSide = true
  else if (
    Number(side) === tcrConstants.SIDE.Challenger &&
    latestRequest.dispute.ruling === tcrConstants.RULING_OPTIONS.Accept
  )
    losingSide = true

  return losingSide
}

const FundAppeal = ({ closeActionModal, fundAppeal, item, tcr, side }) => (
  <>
    <h3 className="Modal-title">
      <FontAwesomeIcon className="Appeal-icon" icon="gavel" />
      Appeal
    </h3>
    <hr />
    <h5 className="Modal-subtitle">
      In order to appeal, the following <br /> amount of ETH is required
    </h5>
    <div className="Appeal-cost">
      <span>Appeal Cost</span>
      <strong>
        {`${item.latestRequest.latestRound.appealCost &&
          web3.utils.fromWei(item.latestRequest.latestRound.appealCost)} ETH`}
      </strong>
    </div>
    <div className="Appeal-cost">
      <span>Arbitration Fee Stake</span>
      <strong>
        {`${String(
          item.latestRequest.latestRound.appealCost &&
            web3.utils.fromWei(
              web3.utils
                .toBN(item.latestRequest.latestRound.appealCost)
                .mul(
                  web3.utils.toBN(
                    isLosingSide(item, side)
                      ? tcr.data.loserStakeMultiplier
                      : tcr.data.winnerStakeMultiplier
                  )
                )
                .div(web3.utils.toBN(tcr.data.MULTIPLIER_DIVISOR))
            )
        )} ETH `}
      </strong>
    </div>
    <br />
    <div className="Appeal-cost">
      <span>Total Due:</span>
      <strong className="Appeal-total-value">
        {`${String(
          item.latestRequest.latestRound.appealCost &&
            web3.utils.fromWei(
              web3.utils.toBN(item.latestRequest.latestRound.appealCost).add(
                web3.utils
                  .toBN(item.latestRequest.latestRound.appealCost)
                  .mul(
                    web3.utils.toBN(
                      isLosingSide(item, side)
                        ? tcr.data.loserStakeMultiplier
                        : tcr.data.winnerStakeMultiplier
                    )
                  )
                  .div(web3.utils.toBN(tcr.data.MULTIPLIER_DIVISOR))
              )
            )
        )} ETH `}
      </strong>
    </div>
    <div
      style={{
        textAlign: 'start',
        fontSize: '12px',
        marginTop: '10px',
        display: 'flex'
      }}
    >
      <FontAwesomeIcon icon="info-circle" />
      <div style={{ marginLeft: '5px' }}>
        <i>
          Note: This is not a fee, it is a deposit and will be refunded if you
          are correct.
        </i>
      </div>
    </div>
    <br />
    <div className="Modal-actions">
      <Button
        className="Appeal-return"
        onClick={closeActionModal}
        type="secondary"
      >
        Cancel
      </Button>
      <Button className="Appeal-request" onClick={fundAppeal} type="primary">
        Appeal
      </Button>
    </div>
  </>
)

FundAppeal.propTypes = {
  // State
  item: tokenSelectors.tokenShape.isRequired,
  tcr: PropTypes.oneOfType([
    arbitrableTokenListSelectors.arbitrableTokenListDataShape,
    arbitrableAddressListSelectors.arbitrableAddressListDataShape
  ]).isRequired,
  side: PropTypes.string.isRequired,

  // Action Dispatchers
  closeActionModal: PropTypes.func.isRequired,
  fundAppeal: PropTypes.func.isRequired
}

export default FundAppeal
