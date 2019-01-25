import React from 'react'
import PropTypes from 'prop-types'
import Img from 'react-image'

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
  badge
}) => (
  <div>
    <div className="Modal-header">
      {/* <div className="Modal-header-icon"/> */}
      <span className="Modal-badge" />
      <h3 className="Modal-title">{badge ? 'Add Badge' : 'Submit a token'}</h3>
      {badge && (
        <Img
          alt="Badge List Submission"
          className="Modal-header-icon"
          src={EthfinexLogo}
        />
      )}
    </div>
    <hr />
    <h5 className="Modal-subtitle">
      {!badge ? 'Fill the form and stake ETH' : ''}
    </h5>
    {!badge && (
      <>
        <TokenForm className="Submit-form" onSubmit={submitItem} />
        <FilePicker
          file={file}
          message={
            <span>
              (Max Size: 15MB)
              <br />
              Drag file here or
            </span>
          }
          multiple={false}
          onDropAccepted={handleOnFileDropAccepted}
        />
      </>
    )}
    {!badge && fileInfoMessage && <div>{fileInfoMessage}</div>}
    <div className="Challenge-cost">
      <span>Challenge Stake</span>
      <strong>
        {`${String(
          web3.utils.fromWei(String(web3.utils.toBN(tcr.data.challengeReward)))
        )} ETH`}
      </strong>
    </div>
    <div className="Challenge-cost">
      <span>Arbitration Fee Stake</span>
      <strong>
        {`${String(
          web3.utils.fromWei(
            String(
              web3.utils
                .toBN(tcr.data.arbitrationCost)
                .mul(web3.utils.toBN(tcr.data.sharedStakeMultiplier))
                .div(web3.utils.toBN(tcr.data.MULTIPLIER_PRECISION))
            )
          )
        )} ETH`}
      </strong>
    </div>
    <div className="Challenge-cost">
      <span>Required Arbitration Fee</span>
      <strong>
        {`${String(
          web3.utils.fromWei(String(web3.utils.toBN(tcr.data.arbitrationCost)))
        )} ETH`}
      </strong>
    </div>
    <br />
    <div className="Challenge-cost">
      <span>Total Due:</span>
      <strong className="Challenge-total-value">
        {`${String(
          web3.utils.fromWei(
            String(
              web3.utils
                .toBN(tcr.data.challengeReward)
                .add(
                  web3.utils
                    .toBN(tcr.data.arbitrationCost)
                    .mul(web3.utils.toBN(tcr.data.sharedStakeMultiplier))
                    .div(web3.utils.toBN(tcr.data.MULTIPLIER_PRECISION))
                )
                .add(web3.utils.toBN(tcr.data.arbitrationCost))
            )
          )
        )} ETH`}
      </strong>
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
        disabled={!badge && (itemFormIsInvalid || !file)}
        onClick={!badge ? submitItemForm : submitItem}
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

  // Action Dispatchers
  closeActionModal: PropTypes.func.isRequired,
  submitItem: PropTypes.func.isRequired,
  handleOnFileDropAccepted: PropTypes.func,

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
  submitItemForm: null
}

export default Submit
