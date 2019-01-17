import React from 'react'
import PropTypes from 'prop-types'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'

import * as arbitrableTokenListSelectors from '../../../../reducers/arbitrable-token-list'
import { web3 } from '../../../../bootstrap/dapp-api'
import Button from '../../../../components/button'

import './fund-dispute.css'

const FundDispute = ({
  arbitrableTokenListData,
  closeActionModal,
  fundDispute
}) => (
  <div>
    <h3 className="Modal-title">
      <FontAwesomeIcon icon="gavel" className="FundDispute-icon" />
      Fund Dispute
    </h3>
    <hr />
    <h5 className="Modal-subtitle">
      To defend your case, the following <br /> amount of ETH is required
    </h5>
    <div className="Challenge-cost">
      <span>Arbitration Stake</span>
      <strong>
        {`${String(
          web3.utils.fromWei(
            String(
              web3.utils
                .toBN(arbitrableTokenListData.data.arbitrationCost)
                .mul(
                  web3.utils.toBN(
                    arbitrableTokenListData.data.sharedStakeMultiplier
                  )
                )
                .div(
                  web3.utils.toBN(
                    arbitrableTokenListData.data.MULTIPLIER_PRECISION
                  )
                )
            )
          )
        )} ETH`}
      </strong>
    </div>
    <div className="Challenge-cost">
      <span>Required Arbitration Fee</span>
      <strong>
        {`${String(
          web3.utils.fromWei(
            String(
              web3.utils.toBN(arbitrableTokenListData.data.arbitrationCost)
            )
          )
        )} ETH`}
      </strong>
    </div>
    <br />
    <div className="FundDispute-cost">
      <span>Total Due:</span>
      <strong className="FundDispute-total-value">
        {`${String(
          web3.utils.fromWei(
            String(
              web3.utils
                .toBN(
                  web3.utils
                    .toBN(arbitrableTokenListData.data.arbitrationCost)
                    .mul(
                      web3.utils.toBN(
                        arbitrableTokenListData.data.sharedStakeMultiplier
                      )
                    )
                    .div(
                      web3.utils.toBN(
                        arbitrableTokenListData.data.MULTIPLIER_PRECISION
                      )
                    )
                )
                .add(
                  web3.utils.toBN(arbitrableTokenListData.data.arbitrationCost)
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
        type="secondary"
        onClick={closeActionModal}
      >
        Return
      </Button>
      <Button
        className="FundDispute-request"
        type="primary"
        onClick={fundDispute}
      >
        Pay Fees
      </Button>
    </div>
  </div>
)

FundDispute.propTypes = {
  // State
  arbitrableTokenListData:
    arbitrableTokenListSelectors.arbitrableTokenListDataShape.isRequired,

  // Action Dispatchers
  closeActionModal: PropTypes.func.isRequired,
  fundDispute: PropTypes.func.isRequired
}

export default FundDispute
