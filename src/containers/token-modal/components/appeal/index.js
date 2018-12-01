import React from 'react'
import PropTypes from 'prop-types'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'

import * as tokenSelectors from '../../../../reducers/token'
import { web3 } from '../../../../bootstrap/dapp-api'
import Button from '../../../../components/button'

import './appeal.css'

const Appeal = ({ closeTokenModal, fundAppeal, token, losingSide }) => (
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
      <span>Appeal Cost</span>
      <strong>
        {`${web3.utils.fromWei(token.latestRequest.appealCost)} ETH`}
      </strong>
    </div>
    <div className="Appeal-cost">
      <span>Arbitration Stake</span>
      <strong>
        {`${losingSide ? `2 * ` : ``}${String(
          web3.utils.fromWei(
            String(
              web3.utils.toBN(token.latestRequest.latestRound.requiredFeeStake)
            )
          )
        )} ETH`}
      </strong>
    </div>
    <br />
    <div className="Appeal-cost">
      <span>Total Due:</span>
      <strong className="Appeal-total-value">
        {losingSide
          ? `${String(
              web3.utils.fromWei(
                String(
                  web3.utils
                    .toBN(token.latestRequest.latestRound.requiredFeeStake)
                    .mul(web3.utils.toBN(2))
                    .add(web3.utils.toBN(token.latestRequest.appealCost))
                )
              )
            )} ETH`
          : `${String(
              web3.utils.fromWei(
                String(
                  web3.utils
                    .toBN(token.latestRequest.latestRound.requiredFeeStake)
                    .add(web3.utils.toBN(token.latestRequest.appealCost))
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
      <Button className="Appeal-request" type="primary" onClick={fundAppeal}>
        Appeal
      </Button>
    </div>
  </div>
)

Appeal.propTypes = {
  // State
  token: tokenSelectors.tokenShape.isRequired,
  losingSide: PropTypes.bool.isRequired,

  // Action Dispatchers
  closeTokenModal: PropTypes.func.isRequired,
  fundAppeal: PropTypes.func.isRequired
}

export default Appeal
