import React from 'react'
import PropTypes from 'prop-types'

import * as arbitrableTokenListSelectors from '../../../../reducers/arbitrable-token-list'
import { web3 } from '../../../../bootstrap/dapp-api'
import Button from '../../../../components/button'

import './clear.css'

const Clear = ({
  arbitrableTokenListData,
  closeTokenModal,
  clearToken,
  tokenName
}) => (
  <div>
    <h3 className="Modal-title">Clear {tokenName}</h3>
    <hr />
    <div className="Clear-stake">
      <h4>
        <strong>Stake:</strong>
      </h4>
      <span>
        {`${String(
          web3.utils.fromWei(
            String(
              web3.utils.toBN(arbitrableTokenListData.data.challengeReward)
            )
          )
        )} ETH`}
      </span>
    </div>
    <br />
    <div className="Modal-actions">
      <Button
        className="Clear-return"
        type="secondary"
        onClick={closeTokenModal}
      >
        Return
      </Button>
      <Button className="Clear-request" type="primary" onClick={clearToken}>
        Request Clearing
      </Button>
    </div>
  </div>
)

Clear.propTypes = {
  // State
  arbitrableTokenListData:
    arbitrableTokenListSelectors.arbitrableTokenListDataShape.isRequired,
  tokenName: PropTypes.string.isRequired,

  // Action Dispatchers
  closeTokenModal: PropTypes.func.isRequired,
  clearToken: PropTypes.func.isRequired
}

export default Clear
