import React from 'react'
import PropTypes from 'prop-types'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'

import * as arbitrableTokenListSelectors from '../../../../reducers/arbitrable-token-list'
import * as arbitrableAddressListSelectors from '../../../../reducers/arbitrable-address-list'
import { web3 } from '../../../../bootstrap/dapp-api'
import Button from '../../../../components/button'
import './challenge.css'

const Challenge = ({ tcr, closeActionModal, fundDispute }) => (
  <div>
    <h3 className="Modal-title">
      <FontAwesomeIcon className="Challenge-icon" icon="gavel" />
      Challenge
    </h3>
    <hr />
    <h5 className="Modal-subtitle">
      In order to challenge, the following <br /> amount of ETH is required
    </h5>
    <div className="Challenge-fees">
      <div>
        <p className="Challenge-fees-line">Challenge Stake</p>
        <p className="Challenge-fees-line">Arbitration Fee Stake</p>
        <p className="Challenge-fees-line">Arbitration Fees</p>
      </div>
      <div>
        <p className="Challenge-fees-line">
          <strong>
            {`${String(
              web3.utils.fromWei(
                String(web3.utils.toBN(tcr.data.challengeReward))
              )
            )}`}
          </strong>
        </p>
        <p className="Challenge-fees-line">
          <strong>
            {String(
              web3.utils.fromWei(
                String(
                  web3.utils
                    .toBN(tcr.data.arbitrationCost)
                    .mul(web3.utils.toBN(tcr.data.sharedStakeMultiplier))
                    .div(web3.utils.toBN(tcr.data.MULTIPLIER_PRECISION))
                )
              )
            )}
          </strong>
        </p>
        <p className="Challenge-fees-line">
          <strong>
            {String(
              web3.utils.fromWei(
                String(web3.utils.toBN(tcr.data.arbitrationCost))
              )
            )}
          </strong>
        </p>
      </div>
      <div className="Challenge-fees-symbols">
        <p className="Challenge-fees-line">
          <strong>ETH</strong>
        </p>
        <p className="Challenge-fees-line">
          <strong>ETH</strong>
        </p>
        <p className="Challenge-fees-line">
          <strong>ETH</strong>
        </p>
      </div>
    </div>
    <br />
    <div className="Challenge-fees">
      <div>
        <p className="Challenge-fees-line">Total Due:</p>
      </div>
      <div>
        <p className="Challenge-fees-line" style={{ marginLeft: '67px' }}>
          <strong>
            {String(
              web3.utils.fromWei(
                String(
                  web3.utils
                    .toBN(tcr.data.challengeReward)
                    .add(
                      web3.utils
                        .toBN(tcr.data.arbitrationCost)
                        .mul(web3.utils.toBN(tcr.data.sharedStakeMultiplier))
                        .div(web3.utils.toBN(tcr.data.MULTIPLIER_PRECISION))
                    )
                    .add(web3.utils.toBN(tcr.data.arbitrationCost))
                )
              )
            )}
          </strong>
        </p>
      </div>
      <div className="Challenge-fees-symbols">
        <p className="Challenge-fees-line">
          <strong>ETH</strong>
        </p>
      </div>
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
  tcr: PropTypes.oneOfType([
    arbitrableTokenListSelectors.arbitrableTokenListDataShape,
    arbitrableAddressListSelectors.arbitrableAddressListDataShape
  ]).isRequired,

  // Action Dispatchers
  closeActionModal: PropTypes.func.isRequired,
  fundDispute: PropTypes.func.isRequired
}

export default Challenge
