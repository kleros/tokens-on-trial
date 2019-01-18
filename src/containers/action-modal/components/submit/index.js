import React from 'react'
import PropTypes from 'prop-types'

import * as arbitrableTokenListSelectors from '../../../../reducers/arbitrable-token-list'
import { web3 } from '../../../../bootstrap/dapp-api'
import Button from '../../../../components/button'
import { TokenForm } from '../../components/submit/token-form'
import FilePicker from '../../../../components/file-picker'
import './submit.css'

const Submit = ({
  arbitrableTokenListData,
  closeActionModal,
  submitToken,
  tokenFormIsInvalid,
  submitTokenForm,
  file,
  fileInfoMessage,
  handleOnFileDropAccepted
}) => (
  <div>
    <h3 className="Modal-title">Submit a Token</h3>
    <hr />
    <h5 className="Modal-subtitle">Fill the required info and stake ETH</h5>
    <TokenForm className="Submit-form" onSubmit={submitToken} />
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
    {fileInfoMessage && <div>{fileInfoMessage}</div>}
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
        onClick={closeActionModal}
        type="secondary"
      >
        Return
      </Button>
      <Button
        className="Submit-request"
        disabled={tokenFormIsInvalid || !file}
        onClick={submitTokenForm}
        type="primary"
      >
        Request Registration
      </Button>
    </div>
  </div>
)

Submit.propTypes = {
  // State
  file: PropTypes.shape({}).isRequired,
  fileInfoMessage: PropTypes.string.isRequired,
  arbitrableTokenListData:
    arbitrableTokenListSelectors.arbitrableTokenListDataShape.isRequired,

  // Action Dispatchers
  closeActionModal: PropTypes.func.isRequired,
  submitToken: PropTypes.func.isRequired,
  handleOnFileDropAccepted: PropTypes.func.isRequired,

  // Token Form
  tokenFormIsInvalid: PropTypes.bool.isRequired,
  submitTokenForm: PropTypes.func.isRequired
}

export default Submit
