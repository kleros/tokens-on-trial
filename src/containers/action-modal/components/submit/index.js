import React from 'react'
import PropTypes from 'prop-types'
import Img from 'react-image'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'

import * as arbitrableTokenListSelectors from '../../../../reducers/arbitrable-token-list'
import * as arbitrableAddressListSelectors from '../../../../reducers/arbitrable-address-list'
import { web3 } from '../../../../bootstrap/dapp-api'
import Button from '../../../../components/button'
import { TokenForm } from '../../components/submit/token-form'
import FilePicker from '../../../../components/file-picker'
import EthfinexLogo from '../../../../assets/images/ethfinex.svg'

import './submit.css'

const Submit = ({
  tcr,
  closeActionModal,
  submitItem,
  itemFormIsInvalid,
  submitItemForm,
  file,
  fileInfoMessage,
  handleOnFileDropAccepted,
  badge,
  item,
  resubmit
}) => (
  <div>
    <div
      className="Modal-header"
      style={!badge ? { justifyContent: 'center' } : {}}
    >
      {badge && <span className="Modal-badge" />}
      <h3 className="Modal-title" style={{ marginTop: 0 }}>
        {badge ? 'Add Badge' : item ? 'Resubmit token' : 'Submit a token'}
      </h3>
      {badge && (
        <Img
          alt="Badge List Submission"
          className="Modal-header-icon"
          src={EthfinexLogo}
        />
      )}
    </div>
    <br />
    {!badge && !item && (
      <>
        <TokenForm className="Submit-form" onSubmit={submitItem} />
        <FilePicker
          file={file}
          message={
            <span>
              (Max Size: 15MB)
              <br />
              Drag file or click here
            </span>
          }
          multiple={false}
          onDropAccepted={handleOnFileDropAccepted}
        />
      </>
    )}
    {!badge && fileInfoMessage && <div>{fileInfoMessage}</div>}
    {!badge && (
      <div
        style={{
          textAlign: 'start',
          fontSize: '11.5px',
          marginTop: '10px',
          marginBottom: '10px',
          display: 'flex'
        }}
      >
        <FontAwesomeIcon icon="exclamation-circle" color="#FF9900" />
        <div style={{ marginLeft: '5px' }}>
          <i>Please, upload the logo with a transparent background</i>
        </div>
      </div>
    )}
    <div className="Challenge-fees">
      <div>
        <p className="Challenge-fees-line">Challenge Deposit</p>
        <p className="Challenge-fees-line">Arbitration Fee Stake</p>
        <p className="Challenge-fees-line">Arbitration Fees</p>
      </div>
      <div>
        <p className="Challenge-fees-line">
          <strong>
            {`${String(
              web3.utils.fromWei(
                String(web3.utils.toBN(tcr.data.challengeReward))
              )
            )}`}
          </strong>
        </p>
        <p className="Challenge-fees-line">
          <strong>
            {String(
              web3.utils.fromWei(
                String(
                  web3.utils
                    .toBN(tcr.data.arbitrationCost)
                    .mul(web3.utils.toBN(tcr.data.sharedStakeMultiplier))
                    .div(web3.utils.toBN(tcr.data.MULTIPLIER_DIVISOR))
                )
              )
            )}
          </strong>
        </p>
        <p className="Challenge-fees-line">
          <strong>
            {String(
              web3.utils.fromWei(
                String(web3.utils.toBN(tcr.data.arbitrationCost))
              )
            )}
          </strong>
        </p>
      </div>
      <div className="Challenge-fees-symbols">
        <p className="Challenge-fees-line">
          <strong>ETH</strong>
        </p>
        <p className="Challenge-fees-line">
          <strong>ETH</strong>
        </p>
        <p className="Challenge-fees-line">
          <strong>ETH</strong>
        </p>
      </div>
    </div>
    <br />
    <div className="Challenge-fees">
      <div>
        <p className="Challenge-fees-line">Total Due:</p>
      </div>
      <div>
        <p className="Challenge-fees-line" style={{ marginLeft: '67px' }}>
          <strong>
            {String(
              web3.utils.fromWei(
                String(
                  web3.utils
                    .toBN(tcr.data.challengeReward)
                    .add(
                      web3.utils
                        .toBN(tcr.data.arbitrationCost)
                        .mul(web3.utils.toBN(tcr.data.sharedStakeMultiplier))
                        .div(web3.utils.toBN(tcr.data.MULTIPLIER_DIVISOR))
                    )
                    .add(web3.utils.toBN(tcr.data.arbitrationCost))
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
    <br />
    <div className="Modal-actions">
      <Button
        className="Submit-return"
        onClick={closeActionModal}
        type="secondary"
      >
        Return
      </Button>
      <Button
        className="Submit-request"
        disabled={!badge && !item && (itemFormIsInvalid || !file)}
        onClick={badge ? submitItem : item ? resubmit : submitItemForm}
        type="primary"
      >
        {!badge ? 'Request Registration' : 'Request Badge Addition'}
      </Button>
    </div>
  </div>
)

Submit.propTypes = {
  // State
  file: PropTypes.shape({}),
  fileInfoMessage: PropTypes.string,
  tcr: PropTypes.oneOfType([
    arbitrableTokenListSelectors.arbitrableTokenListDataShape,
    arbitrableAddressListSelectors.arbitrableAddressListDataShape
  ]).isRequired,
  badge: PropTypes.bool,
  item: PropTypes.shape({}),

  // Action Dispatchers
  closeActionModal: PropTypes.func.isRequired,
  submitItem: PropTypes.func.isRequired,
  handleOnFileDropAccepted: PropTypes.func,
  resubmit: PropTypes.func,

  // Item Form
  itemFormIsInvalid: PropTypes.bool,
  submitItemForm: PropTypes.func
}

Submit.defaultProps = {
  file: null,
  fileInfoMessage: '',
  itemFormIsInvalid: null,
  badge: null,
  handleOnFileDropAccepted: null,
  submitItemForm: null,
  resubmit: null,
  item: null
}

export default Submit
