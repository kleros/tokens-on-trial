import React from 'react'
import PropTypes from 'prop-types'
import { web3Utils } from '../../bootstrap/dapp-api'
import { itemShape } from '../../reducers/generic-shapes'
import './withdraw-funds.css'

const WithdrawFundsButton = ({
  item: { withdrawable },
  onWithdrawFundsClick,
}) =>
  withdrawable.gt(web3Utils.toBN(0)) && (
    <>
      <div className="WithdrawFunds-divider" />
      <h5 className="WithdrawFunds-withdraw" onClick={onWithdrawFundsClick}>
        <span className="WithdrawFunds-withdraw-value">
          {Number(web3Utils.fromWei(withdrawable.toString())).toFixed(4)} ETH{' '}
        </span>
        Withdraw Funds
      </h5>
    </>
  )

WithdrawFundsButton.propTypes = {
  item: itemShape.isRequired,
  onWithdrawFundsClick: PropTypes.func.isRequired,
}

export default WithdrawFundsButton
