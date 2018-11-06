import React from 'react'
import PropTypes from 'prop-types'

import * as arbitrableTokenListSelectors from '../../../../reducers/arbitrable-token-list'
import { web3 } from '../../../../bootstrap/dapp-api'
import Button from '../../../../components/button'
import { TokenForm } from '../../components/submit/token-form'

import './submit.css'

const Submit = ({
  arbitrableTokenListData,
  closeTokenModal,
  submitToken,
  tokenFormIsInvalid,
  submitTokenForm
}) => (
  <div>
    <h3 className="Modal-title">Submit a Token</h3>
    <hr />
    <h5>Fill the required info and stake ETH</h5>
    <TokenForm className="Submit-form" onSubmit={submitToken} />
    <div className="Submit-stake">
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
        className="Submit-return"
        type="secondary"
        onClick={closeTokenModal}
      >
        Return
      </Button>
      <Button
        className="Submit-request"
        type="primary"
        onClick={submitTokenForm}
        disabled={tokenFormIsInvalid}
      >
        Request Registration
      </Button>
    </div>
  </div>
)

Submit.propTypes = {
  // State
  arbitrableTokenListData:
    arbitrableTokenListSelectors.arbitrableTokenListDataShape.isRequired,

  // Action Dispatchers
  closeTokenModal: PropTypes.func.isRequired,
  submitToken: PropTypes.func.isRequired,

  // Token Form
  tokenFormIsInvalid: PropTypes.bool.isRequired,
  submitTokenForm: PropTypes.func.isRequired
}

export default Submit
