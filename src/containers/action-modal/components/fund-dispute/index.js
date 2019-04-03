import React from 'react'
import PropTypes from 'prop-types'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'

import * as arbitrableTokenListSelectors from '../../../../reducers/arbitrable-token-list'
import * as arbitrableAddressListSelectors from '../../../../reducers/arbitrable-address-list'
import { web3Utils } from '../../../../bootstrap/dapp-api'
import Button from '../../../../components/button'
import { truncateETHValue } from '../../../../utils/ui'
import './fund-dispute.css'

const FundDispute = ({ tcr, closeActionModal, fundDispute }) => (
  <div>
    <h3 className="Modal-title">
      <FontAwesomeIcon className="FundDispute-icon" icon="gavel" />
      Fund Dispute
    </h3>
    <hr />
    <h5 className="Modal-subtitle">
      To defend your case, the following <br /> amount of ETH is required
    </h5>
    <div className="Challenge-cost">
      <span>Arbitration Fee Stake</span>
      <strong>
        {`${truncateETHValue(
          String(
            web3Utils.fromWei(
              String(
                web3Utils
                  .toBN(tcr.data.arbitrationCost)
                  .mul(web3Utils.toBN(tcr.data.sharedStakeMultiplier))
                  .div(web3Utils.toBN(tcr.data.MULTIPLIER_DIVISOR))
              )
            )
          )
        )} ETH`}
      </strong>
    </div>
    <div className="Challenge-cost">
      <span>Required Arbitration Fee</span>
      <strong>
        {`${truncateETHValue(
          String(
            web3Utils.fromWei(String(web3Utils.toBN(tcr.data.arbitrationCost)))
          )
        )} ETH`}
      </strong>
    </div>
    <br />
    <div className="FundDispute-cost">
      <span>Total Deposit:</span>
      <strong className="FundDispute-total-value">
        {`${truncateETHValue(
          String(
            web3Utils.fromWei(
              String(
                web3Utils
                  .toBN(
                    web3Utils
                      .toBN(tcr.data.arbitrationCost)
                      .mul(web3Utils.toBN(tcr.data.sharedStakeMultiplier))
                      .div(web3Utils.toBN(tcr.data.MULTIPLIER_DIVISOR))
                  )
                  .add(web3Utils.toBN(tcr.data.arbitrationCost))
              )
            )
          )
        )} ETH`}
      </strong>
    </div>
    <br />
    <div className="Modal-actions">
      <Button
        className="FundDispute-return"
        onClick={closeActionModal}
        type="secondary"
      >
        Return
      </Button>
      <Button
        className="FundDispute-request"
        onClick={fundDispute}
        type="primary"
      >
        Pay Fees
      </Button>
    </div>
  </div>
)

FundDispute.propTypes = {
  // State
  tcr: PropTypes.oneOfType([
    arbitrableTokenListSelectors.arbitrableTokenListDataShape,
    arbitrableAddressListSelectors.arbitrableAddressListDataShape
  ]).isRequired,

  // Action Dispatchers
  closeActionModal: PropTypes.func.isRequired,
  fundDispute: PropTypes.func.isRequired
}

export default FundDispute
