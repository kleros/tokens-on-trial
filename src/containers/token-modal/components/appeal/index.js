import React from 'react'
import PropTypes from 'prop-types'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'

import * as arbitrableTokenListSelectors from '../../../../reducers/arbitrable-token-list'
import * as tokenSelectors from '../../../../reducers/token'
import { web3 } from '../../../../bootstrap/dapp-api'
import Button from '../../../../components/button'

import './appeal.css'

const Appeal = ({
  arbitrableTokenListData,
  closeTokenModal,
  fundDispute,
  token
}) => (
  <div>
    <h3 className="Modal-title">
      <FontAwesomeIcon icon="gavel" className="Appeal-icon" />
      Appeal
    </h3>
    <hr />
    <h5 className="Modal-subtitle">
      In order to appeal, the following <br /> amount of ETH is required
    </h5>
    <div className="Appeal-cost">
      <span>Appeal Stake</span>
      <strong>
        {`${String(
          web3.utils.fromWei(
            String(web3.utils.toBN(token.latestRequest.appealReward))
          )
        )} ETH`}
      </strong>
    </div>
    <div className="Appeal-cost">
      <span>Arbitration Stake</span>
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
    <div className="Appeal-cost">
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
    <div className="Appeal-cost">
      <span>Total Due:</span>
      <strong className="Appeal-total-value">
        {`${String(
          web3.utils.fromWei(
            String(
              web3.utils
                .toBN(token.latestRequest.appealReward)
                .add(
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
        className="Appeal-return"
        type="secondary"
        onClick={closeTokenModal}
      >
        Return
      </Button>
      <Button className="Appeal-request" type="primary" onClick={fundDispute}>
        Appeal
      </Button>
    </div>
  </div>
)

Appeal.propTypes = {
  // State
  arbitrableTokenListData:
    arbitrableTokenListSelectors.arbitrableTokenListDataShape.isRequired,
  token: tokenSelectors.tokenShape.isRequired,

  // Action Dispatchers
  closeTokenModal: PropTypes.func.isRequired,
  fundDispute: PropTypes.func.isRequired
}

export default Appeal
