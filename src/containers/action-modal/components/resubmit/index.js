import React from 'react'
import PropTypes from 'prop-types'

import * as arbitrableTokenListSelectors from '../../../../reducers/arbitrable-token-list'
import { web3 } from '../../../../bootstrap/dapp-api'
import Button from '../../../../components/button'
import './resubmit.css'

const Resubmit = ({
  arbitrableTokenListData,
  closeActionModal,
  resubmitToken,
  name
}) => (
  <div>
    <h3 className="Modal-title">Resubmit {name}</h3>
    <hr />
    <div className="Resubmit-stake">
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
        className="Resubmit-return"
        onClick={closeActionModal}
        type="secondary"
      >
        Return
      </Button>
      <Button
        className="Resubmit-request"
        onClick={resubmitToken}
        type="primary"
      >
        Resubmit token
      </Button>
    </div>
  </div>
)

Resubmit.propTypes = {
  // State
  arbitrableTokenListData:
    arbitrableTokenListSelectors.arbitrableTokenListDataShape.isRequired,
  name: PropTypes.string.isRequired,

  // Action Dispatchers
  closeActionModal: PropTypes.func.isRequired,
  resubmitToken: PropTypes.func.isRequired
}

export default Resubmit
