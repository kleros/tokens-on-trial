import React from 'react'
import PropTypes from 'prop-types'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'

import * as arbitrableTokenListSelectors from '../../../../reducers/arbitrable-token-list'
import * as arbitrableAddressListSelectors from '../../../../reducers/arbitrable-address-list'
import { web3Utils } from '../../../../bootstrap/dapp-api'
import Button from '../../../../components/button'
import { TokenForm } from '../../components/submit/token-form'
import FilePicker from '../../../../components/file-picker'
import { truncateETHValue } from '../../../../utils/ui'

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
  item,
  resubmit
}) => (
  <div className="ActionModal">
    <div className="Modal-header" style={{ justifyContent: 'center' }}>
      <h3 className="Modal-title" style={{ marginTop: 0 }}>
        {item ? 'Resubmit token' : 'Submit a token'}
      </h3>
    </div>
    <hr />
    <h5 className="Modal-subtitle" style={{ marginBottom: 0 }}>
      See the{' '}
      {/* TODO: Swap hardcoded URL for URI provided in the fileURI of the latest meta evidence, once it goes live. */}
      <a href="https://ipfs.kleros.io/ipfs/QmWqmVkjigLjcmZ4fZdsKKLhKEViUoKce9HK3Z2mUxDZgE/blockchain-non-technical.pdf">
        listing criteria
      </a>
      {!item && ', complete the information below'} and submit.
    </h5>
    {!item && (
      <>
        <br />
        <TokenForm className="Submit-form" onSubmit={submitItem} />
        <FilePicker
          file={file}
          message={
            <span style={{ color: '#505050' }}>
              (Max Size: 1 MB)
              <br />
              Drag your transparent PNG or click here.
            </span>
          }
          multiple={false}
          onDropAccepted={handleOnFileDropAccepted}
          imageFilePreviewURL={file ? file.preview : null}
        />
      </>
    )}
    {fileInfoMessage && (
      <div style={{ color: '#f66e0c', fontSize: '12px', textAlign: 'start' }}>
        {fileInfoMessage}
      </div>
    )}
    {!item && (
      <div
        style={{
          textAlign: 'start',
          fontSize: '11.5px',
          marginTop: '10px',
          display: 'flex'
        }}
      >
        <FontAwesomeIcon icon="exclamation-circle" color="#FF9900" />
        <div style={{ marginLeft: '5px' }}>
          <i>
            Please ensure the logo is a transparent high resolution{' '}
            <strong>PNG</strong>.
          </i>
        </div>
      </div>
    )}
    <div className="Challenge-fees" style={{ marginTop: '15px' }}>
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
                      .toBN(tcr.data.requesterBaseDeposit)
                      .add(
                        web3Utils
                          .toBN(tcr.data.arbitrationCost)
                          .mul(web3Utils.toBN(tcr.data.sharedStakeMultiplier))
                          .div(web3Utils.toBN(tcr.data.MULTIPLIER_DIVISOR))
                      )
                      .add(web3Utils.toBN(tcr.data.arbitrationCost))
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
        marginTop: '15px',
        display: 'flex'
      }}
    >
      <FontAwesomeIcon icon="info-circle" />
      <div style={{ marginLeft: '5px' }}>
        <i>Note: This is a deposit and will be refunded if you are correct.</i>
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
      <FontAwesomeIcon icon="info-circle" color="#ef0101" />
      <div style={{ marginLeft: '5px' }}>
        <i>
          After your token is accepted, you can add badges to it to certify that
          it meets some additional criteria. For example, add an Ethfinex badge
          to certify that it meets Ethfinex’s listing criteria and qualifies for
          the community vote.
        </i>
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
        disabled={!item && (itemFormIsInvalid || !file)}
        onClick={item ? resubmit : submitItemForm}
        type="primary"
      >
        Submit
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
  handleOnFileDropAccepted: null,
  submitItemForm: null,
  resubmit: null,
  item: null
}

export default Submit
