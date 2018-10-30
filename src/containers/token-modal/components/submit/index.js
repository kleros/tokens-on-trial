import React from 'react'
import PropTypes from 'prop-types'

import ValueList from '../../../../components/value-list'
import Button from '../../../../components/button'
import { TokenForm } from '../../components/submit/token-form'

import './submit.css'

const Submit = ({ handleSubmitRequest, handleReturn }) => (
  <div>
    <h3 className="Modal-title">Submit a Token</h3>
    <hr />
    <h5>Fill the required info and stake ETH</h5>
    <TokenForm className="Submit-form" />
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
      <Button className="Submit-return" type="secondary" onClick={handleReturn}>
        Return
      </Button>
      <Button
        className="Submit-request"
        type="primary"
        onClick={handleSubmitRequest}
      >
        Request Registration
      </Button>
    </div>
  </div>
)

Submit.propTypes = {
  handleSubmitRequest: PropTypes.func.isRequired,
  handleReturn: PropTypes.func.isRequired
}

export default Submit
