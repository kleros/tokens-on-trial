import React from 'react'
import PropTypes from 'prop-types'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'

import * as arbitrableTokenListSelectors from '../../../../reducers/arbitrable-token-list'
import * as arbitrableAddressListSelectors from '../../../../reducers/arbitrable-address-list'
import { web3Utils, IPFS_URL } from '../../../../bootstrap/dapp-api'
import Button from '../../../../components/button'
import { truncateETHValue } from '../../../../utils/ui'

import './submit-badge.css'

const SubmitBadge = ({
  arbitrableAddressListData,
  closeActionModal,
  submitItem,
  badgeContractAddr,
  tokenAddr
}) => (
  <div className="ActionModal">
    <h3 className="Modal-title">Add Badge</h3>
    <hr />
    <p>
      See the{' '}
      <a
        className="TokenDetails-withdraw"
        target="_blank"
        rel="noopener noreferrer"
        href={`${IPFS_URL}${arbitrableAddressListData.fileURI}`}
        style={{ margin: 0, textDecoration: 'underline' }}
      >
        listing criteria
      </a>
      .
    </p>
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
                web3Utils.fromWei(
                  String(
                    web3Utils
                      .toBN(arbitrableAddressListData.requesterBaseDeposit)
                      .add(
                        web3Utils
                          .toBN(arbitrableAddressListData.arbitrationCost)
                          .mul(
                            web3Utils.toBN(
                              arbitrableAddressListData.sharedStakeMultiplier
                            )
                          )
                          .div(
                            web3Utils.toBN(
                              arbitrableAddressListData.MULTIPLIER_DIVISOR
                            )
                          )
                      )
                      .add(
                        web3Utils.toBN(
                          arbitrableAddressListData.arbitrationCost
                        )
                      )
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
    <div
      style={{
        textAlign: 'start',
        fontSize: '12px',
        marginTop: '10px',
        display: 'flex'
      }}
    >
      <FontAwesomeIcon icon="info-circle" />
      <div style={{ marginLeft: '5px' }}>
        <i>
          Note: This is a deposit and will be reimbursed if the submission is
          accepted.
        </i>
      </div>
    </div>
    <br />
    <div className="Modal-actions">
      <Button
        className="SubmitBadge-return"
        onClick={closeActionModal}
        type="secondary"
      >
        Return
      </Button>
      {/* eslint-disable react/jsx-no-bind */}
      <Button
        className="SubmitBadge-request"
        onClick={() => submitItem(badgeContractAddr, tokenAddr)}
        type="primary"
      >
        Add Badge
      </Button>
    </div>
  </div>
)

SubmitBadge.propTypes = {
  // State
  arbitrableAddressListData: PropTypes.oneOfType([
    arbitrableTokenListSelectors.arbitrableTokenListDataShape,
    arbitrableAddressListSelectors.arbitrableAddressListDataShape
  ]).isRequired,
  badgeContractAddr: PropTypes.string.isRequired,
  tokenAddr: PropTypes.string.isRequired,

  // Action Dispatchers
  closeActionModal: PropTypes.func.isRequired,
  submitItem: PropTypes.func.isRequired
}

export default SubmitBadge
