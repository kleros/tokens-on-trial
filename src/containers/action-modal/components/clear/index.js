import React from 'react'
import PropTypes from 'prop-types'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import * as arbitrableTokenListSelectors from '../../../../reducers/arbitrable-token-list'
import * as arbitrableAddressListSelectors from '../../../../reducers/arbitrable-address-list'
import { web3Utils, IPFS_URL } from '../../../../bootstrap/dapp-api'
import Button from '../../../../components/button'
import { truncateETHValue } from '../../../../utils/ui'
import './clear.css'

const Clear = ({ tcrData, closeActionModal, clearItem, item, badge }) => (
  <div className="ActionModal">
    <h3 className="Modal-title">
      {!badge ? `Remove ${item.name}` : 'Remove Badge'}
    </h3>
    <hr />
    <p>
      See the{' '}
      <a
        className="TokenDetails-withdraw"
        target="_blank"
        rel="noopener noreferrer"
        href={`${IPFS_URL}${tcrData.fileURI}`}
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
                      .toBN(tcrData.requesterBaseDeposit)
                      .add(
                        web3Utils
                          .toBN(tcrData.arbitrationCost)
                          .mul(web3Utils.toBN(tcrData.sharedStakeMultiplier))
                          .div(web3Utils.toBN(tcrData.MULTIPLIER_DIVISOR))
                      )
                      .add(web3Utils.toBN(tcrData.arbitrationCost))
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
        display: 'flex',
      }}
    >
      <FontAwesomeIcon icon="info-circle" />
      <div style={{ marginLeft: '5px' }}>
        <i>
          Note: This is a deposit and will be refunded if the removal is
          successful.
        </i>
      </div>
    </div>
    <br />
    <div className="Modal-actions">
      <Button
        className="Clear-return"
        onClick={closeActionModal}
        type="secondary"
      >
        Return
      </Button>
      <Button className="Clear-request" onClick={clearItem} type="primary">
        Request Removal
      </Button>
    </div>
  </div>
)

Clear.propTypes = {
  // State
  item: PropTypes.shape({ name: PropTypes.string.isRequired }),
  tcrData: PropTypes.oneOfType([
    arbitrableTokenListSelectors.arbitrableTokenListDataShape,
    arbitrableAddressListSelectors.arbitrableAddressListDataShape,
  ]).isRequired,
  badge: PropTypes.bool,

  // Action Dispatchers
  closeActionModal: PropTypes.func.isRequired,
  clearItem: PropTypes.func.isRequired,
}

Clear.defaultProps = {
  item: null,
  badge: false,
}

export default Clear
