import React from 'react'
import PropTypes from 'prop-types'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'

import * as arbitrableTokenListSelectors from '../../../../reducers/arbitrable-token-list'
import * as tokenSelectors from '../../../../reducers/token'
import { web3 } from '../../../../bootstrap/dapp-api'
import Button from '../../../../components/button'

import './fund-dispute.css'

const FundDispute = ({
  arbitrableTokenListData,
  closeTokenModal,
  fundDispute,
  token
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
    <div className="FundDispute-cost">
      <span>Fee Stake</span>
      <strong>
        {`${String(
          web3.utils.fromWei(
            String(
              web3.utils.toBN(token.latestRequest.latestRound.requiredFeeStake)
            )
          )
        )} ETH`}
      </strong>
    </div>
    <div className="FundDispute-cost">
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
                  web3.utils.toBN(
                    token.latestRequest.latestRound.requiredFeeStake
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
        onClick={closeTokenModal}
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
  token: tokenSelectors.tokenShape.isRequired,

  // Action Dispatchers
  closeTokenModal: PropTypes.func.isRequired,
  fundDispute: PropTypes.func.isRequired
}

export default FundDispute
