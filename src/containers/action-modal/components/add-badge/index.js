import React, { useState } from 'react'
import Img from 'react-image'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import { IPFS_URL, web3Utils } from '../../../../bootstrap/dapp-api'
import Button from '../../../../components/button'
import { truncateETHValue } from '../../../../utils/ui'
import { arbitrableAddressListDataShape } from '../../../../reducers/arbitrable-address-list'

import './add-badge.css'

const AddBadge = ({
  closeActionModal,
  submitItem,
  arbitrableAddressListData,
  tokenAddr,
  unavailable
}) => {
  const badgeContracts = Object.keys(arbitrableAddressListData)
    .map(badgeContractAddr => arbitrableAddressListData[badgeContractAddr])
    .filter(badgeContract => badgeContract.variables)
    .filter(
      badgeContract =>
        !unavailable.reduce((acc, curr) => {
          acc[curr] = true
          return acc
        }, {})[badgeContract.badgeContractAddr]
    )

  const [option, setOption] = useState()

  return (
    <div className="AddBadge">
      <div className="AddBadge-header">
        <span className="Modal-badge AddBadge-header-badge" />
        <span className="AddBadge-header-title">Add Badge</span>
      </div>
      <div className="AddBadge-options">
        {badgeContracts.map(badgeContract => (
          <div
            className="AddBadge-options-item"
            key={badgeContract.badgeContractAddr}
          >
            <Img
              alt="Badge List Submission"
              className="AddBadge-options-item-logo"
              src={`${IPFS_URL}${badgeContract.variables.symbolURI}`}
            />
            <div className="AddBadge-options-item-desc">
              <div className="AddBadge-options-item-desc-text">
                Compliant with {badgeContract.variables.title}
              </div>
              <div>
                See{' '}
                <a href={`${IPFS_URL}${badgeContract.fileURI}`}>
                  Listing Criteria
                </a>
                .
              </div>
            </div>
            <label className="AddBadge-options-item-radio">
              {/* eslint-disable react/jsx-no-bind */}
              <input
                type="radio"
                name="radio"
                value={badgeContract.badgeContractAddr}
                checked={option === badgeContract.badgeContractAddr}
                onChange={() => setOption(badgeContract.badgeContractAddr)}
                className="AddBadge-options-item-radio-input"
              />
              <span className="AddBadge-options-item-radio-bg" />
              <span
                className={`${
                  option === badgeContract.badgeContractAddr
                    ? 'AddBadge-options-item-radio-marked'
                    : ''
                }`}
              />
            </label>
          </div>
        ))}
      </div>
      <div className="AddBadge-footer">
        <div className="AddBadge-footer-deposit">
          <span className="AddBadge-footer-deposit-label">Total deposit: </span>
          <span className="AddBadge-footer-deposit-value">
            {option
              ? truncateETHValue(
                  String(
                    web3Utils.fromWei(
                      String(
                        web3Utils
                          .toBN(
                            arbitrableAddressListData[option]
                              .requesterBaseDeposit
                          )
                          .add(
                            web3Utils
                              .toBN(
                                arbitrableAddressListData[option]
                                  .arbitrationCost
                              )
                              .mul(
                                web3Utils.toBN(
                                  arbitrableAddressListData[option]
                                    .sharedStakeMultiplier
                                )
                              )
                              .div(
                                web3Utils.toBN(
                                  arbitrableAddressListData[option]
                                    .MULTIPLIER_DIVISOR
                                )
                              )
                          )
                          .add(
                            web3Utils.toBN(
                              arbitrableAddressListData[option].arbitrationCost
                            )
                          )
                      )
                    )
                  )
                )
              : '0.00'}{' '}
            ETH
          </span>
        </div>
        <div className="AddBadge-footer-actions">
          <Button
            className="AddBadge-footer-actions-return"
            onClick={closeActionModal}
            type="secondary"
          >
            Return
          </Button>
          <Button
            className="AddBadge-footer-actions-action"
            type="primary"
            disabled={!option}
            onClick={() => submitItem(option, tokenAddr)}
          >
            Add Badge
          </Button>
        </div>
      </div>
    </div>
  )
}

AddBadge.propTypes = {
  closeActionModal: PropTypes.func.isRequired,
  submitItem: PropTypes.func.isRequired,
  tokenAddr: PropTypes.string.isRequired,
  arbitrableAddressListData: arbitrableAddressListDataShape.isRequired,
  unavailable: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired
}

export default connect(state => ({
  arbitrableAddressListData:
    state.arbitrableAddressList.arbitrableAddressListData.data
}))(AddBadge)
