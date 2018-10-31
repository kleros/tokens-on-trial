import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import * as tokenActions from '../../../../actions/token'
import * as modalActions from '../../../../actions/modal'
import ValueList from '../../../../components/value-list'
import Button from '../../../../components/button'
import {
  TokenForm,
  getTokenFormIsInvalid,
  submitTokenForm
} from '../../components/submit/token-form'

import './submit.css'

const Submit = ({
  closeTokenModal,
  submitToken,
  tokenFormIsInvalid,
  submitTokenForm
}) => (
  <div>
    <h3 className="Modal-title">Submit a Token</h3>
    <hr />
    <h5>Fill the required info and stake ETH</h5>
    <TokenForm className="Submit-form" onSubmit={submitToken} />
    <br />
    <ValueList
      items={[
        {
          label: 'Stake',
          value: `0.15 ETH`
        }
      ]}
    />
    <br />
    <div className="Modal-actions">
      <Button
        className="Submit-return"
        type="secondary"
        onClick={closeTokenModal}
      >
        Return
      </Button>
      <Button
        className="Submit-request"
        type="primary"
        onClick={submitTokenForm}
        disabled={tokenFormIsInvalid}
      >
        Request Registration
      </Button>
    </div>
  </div>
)

Submit.propTypes = {
  // Action Dispatchers
  closeTokenModal: PropTypes.func.isRequired,
  submitToken: PropTypes.func.isRequired,

  // Token Form
  tokenFormIsInvalid: PropTypes.bool.isRequired,
  submitTokenForm: PropTypes.func.isRequired
}

export default connect(
  state => ({
    tokenFormIsInvalid: getTokenFormIsInvalid(state)
  }),
  {
    submitToken: tokenActions.createToken,
    closeTokenModal: modalActions.closeTokenModal,
    submitTokenForm
  }
)(Submit)
