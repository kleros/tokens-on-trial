import React from 'react'
import PropTypes from 'prop-types'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'

import * as arbitrableTokenListSelectors from '../../../../reducers/arbitrable-token-list'
import { web3 } from '../../../../bootstrap/dapp-api'
import Button from '../../../../components/button'
import './challenge.css'

const Challenge = ({
  arbitrableTokenListData,
  closeActionModal,
  fundDispute
}) => (
  <div>
    <h3 className="Modal-title">
      <FontAwesomeIcon className="Challenge-icon" icon="gavel" />
      Challenge
    </h3>
    <hr />
    <h5 className="Modal-subtitle">
      In order to challenge, the following <br /> amount of ETH is required
    </h5>
    <div className="Challenge-cost">
      <span>Challenge Stake</span>
      <strong>
        {`${String(
          web3.utils.fromWei(
            String(
              web3.utils.toBN(arbitrableTokenListData.data.challengeReward)
            )
          )
        )} ETH`}
      </strong>
    </div>
    <div className="Challenge-cost">
      <span>Arbitration Fee Stake</span>
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
    <div className="Challenge-cost">
      <span>Total Due:</span>
      <strong className="Challenge-total-value">
        {`${String(
          web3.utils.fromWei(
            String(
              web3.utils
                .toBN(arbitrableTokenListData.data.challengeReward)
                .add(
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
        className="Challenge-return"
        onClick={closeActionModal}
        type="secondary"
      >
        Return
      </Button>
      <Button
        className="Challenge-request"
        onClick={fundDispute}
        type="primary"
      >
        Challenge
      </Button>
    </div>
  </div>
)

Challenge.propTypes = {
  // State
  arbitrableTokenListData:
    arbitrableTokenListSelectors.arbitrableTokenListDataShape.isRequired,

  // Action Dispatchers
  closeActionModal: PropTypes.func.isRequired,
  fundDispute: PropTypes.func.isRequired
}

export default Challenge
