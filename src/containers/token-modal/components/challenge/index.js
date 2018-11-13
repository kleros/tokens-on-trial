import React from 'react'
import PropTypes from 'prop-types'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'

import * as arbitrableTokenListSelectors from '../../../../reducers/arbitrable-token-list'
import { web3 } from '../../../../bootstrap/dapp-api'
import Button from '../../../../components/button'

import './challenge.css'

const Challenge = ({
  arbitrableTokenListData,
  closeTokenModal,
  fundDispute
}) => (
  <div>
    <h3 className="Modal-title">
      <FontAwesomeIcon icon="gavel" className="Challenge-icon" />
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
      <span>Arbitration Stake</span>
      <strong>
        {`${String(
          web3.utils.fromWei(
            String(web3.utils.toBN(arbitrableTokenListData.data.stake))
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
              web3.utils.toBN(arbitrableTokenListData.data.arbitrationCost / 2)
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
                .add(web3.utils.toBN(arbitrableTokenListData.data.stake))
                .add(
                  web3.utils.toBN(
                    arbitrableTokenListData.data.arbitrationCost / 2
                  )
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
        type="secondary"
        onClick={closeTokenModal}
      >
        Return
      </Button>
      <Button
        className="Challenge-request"
        type="primary"
        onClick={fundDispute}
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
  closeTokenModal: PropTypes.func.isRequired,
  fundDispute: PropTypes.func.isRequired
}

export default Challenge
