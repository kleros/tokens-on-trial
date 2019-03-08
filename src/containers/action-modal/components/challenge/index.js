import React from 'react'
import PropTypes from 'prop-types'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import { connect } from 'react-redux'

import * as arbitrableTokenListSelectors from '../../../../reducers/arbitrable-token-list'
import * as arbitrableAddressListSelectors from '../../../../reducers/arbitrable-address-list'
import { web3 } from '../../../../bootstrap/dapp-api'
import Button from '../../../../components/button'
import { truncateETHValue } from '../../../../utils/ui'

import {
  ChallengeForm,
  submitChallengeForm,
  getChallengeFormIsInvalid
} from './challenge-form'

import './challenge.css'

const Challenge = ({
  tcr,
  closeActionModal,
  fundDispute,
  challengeFormIsInvalid,
  submitChallengeForm
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
    <br />
    <div className="Challenge-fees">
      <div>
        <p className="Challenge-fees-line">Total Deposit:</p>
      </div>
      <div>
        <p className="Challenge-fees-line" style={{ marginLeft: '67px' }}>
          <strong>
            {truncateETHValue(
              String(
                web3.utils.fromWei(
                  String(
                    web3.utils
                      .toBN(tcr.data.challengerBaseDeposit)
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
    <p style={{ textAlign: 'start', marginTop: '12px', lineHeight: '1.16' }}>
      <small>
        Explain why you think this submission should be rejected (this will be
        seen by jurors).
      </small>
    </p>
    <ChallengeForm className="Challenge-form" onSubmit={fundDispute} />
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
        onClick={submitChallengeForm}
        disabled={challengeFormIsInvalid}
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
  challengeFormIsInvalid: PropTypes.bool.isRequired,

  // Action Dispatchers
  closeActionModal: PropTypes.func.isRequired,
  fundDispute: PropTypes.func.isRequired,
  submitChallengeForm: PropTypes.func.isRequired
}

export default connect(
  state => ({
    challengeFormIsInvalid: getChallengeFormIsInvalid(state)
  }),
  {
    submitChallengeForm
  }
)(Challenge)
