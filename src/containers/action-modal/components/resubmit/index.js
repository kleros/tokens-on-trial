import React from 'react'
import PropTypes from 'prop-types'

import * as arbitrableTokenListSelectors from '../../../../reducers/arbitrable-token-list'
import * as arbitrableAddressListSelectors from '../../../../reducers/arbitrable-address-list'
import * as tokenSelectors from '../../../../reducers/token'
import { web3 } from '../../../../bootstrap/dapp-api'
import Button from '../../../../components/button'
import { truncateETHValue } from '../../../../utils/ui'

import './resubmit.css'

const Resubmit = ({ tcr, closeActionModal, resubmitToken, item }) => (
  <div>
    <h3 className="Modal-title">Resubmit {item.name}</h3>
    <hr />
    <br />
    <div className="Challenge-cost">
      <span>Total Deposit:</span>
      <strong className="Challenge-total-value">
        {`${truncateETHValue(
          String(
            web3.utils.fromWei(
              String(
                web3.utils
                  .toBN(tcr.data.requesterBaseDeposit)
                  .add(
                    web3.utils
                      .toBN(tcr.data.arbitrationCost)
                      .mul(web3.utils.toBN(tcr.data.sharedStakeMultiplier))
                      .div(web3.utils.toBN(tcr.data.MULTIPLIER_DIVISOR))
                  )
                  .add(web3.utils.toBN(tcr.data.arbitrationCost))
              )
            )
          )
        )} ETH`}
      </strong>
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
  item: tokenSelectors.tokenShape,
  tcr: PropTypes.oneOfType([
    arbitrableTokenListSelectors.arbitrableTokenListDataShape,
    arbitrableAddressListSelectors.arbitrableAddressListDataShape
  ]).isRequired,

  // Action Dispatchers
  closeActionModal: PropTypes.func.isRequired,
  resubmitToken: PropTypes.func.isRequired
}

Resubmit.defaultProps = {
  item: null
}

export default Resubmit
