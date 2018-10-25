import React from 'react'
import PropTypes from 'prop-types'
import { RenderIf } from 'lessdux'
import { Link } from 'react-router-dom'
import { BeatLoader } from 'react-spinners'

import { web3 } from '../../../../bootstrap/dapp-api'
import * as arbitrableTokenListSelectors from '../../../../reducers/arbitrable-token-list'
import * as tokenSelectors from '../../../../reducers/token'
import InfoCard from '../../../../components/info-card'
import FilePicker from '../../../../components/file-picker'
import ValueList from '../../../../components/value-list'
import Button from '../../../../components/button'
import deposit from '../../../../assets/images/deposit.svg'

import './submit.css'

const Submit = ({
  arbitrableTokenListData,
  token,
  imageFileDataURL,
  imageFileInfoMessage,
  handleOnFileDropAccepted,
  handleSubmitTokenClick
}) => (
  <div className="Submit">
    {imageFileInfoMessage && <InfoCard message={imageFileInfoMessage} />}
    <h1>Submit your Token</h1>
    {token.creating ? (
      <BeatLoader color="#3d464d" />
    ) : (
      <FilePicker
        multiple={false}
        onDropAccepted={handleOnFileDropAccepted}
        message={
          <span>
            (Max Size: 300KB)
            <br />
            (Min W/H: 250px/250px)
            <br />
            Drag file here or
          </span>
        }
        imageFilePreviewURL={imageFileDataURL}
      />
    )}
    <br />
    <br />
    <RenderIf
      resource={arbitrableTokenListData}
      loading={<BeatLoader color="#3d464d" />}
      done={
        arbitrableTokenListData.data && (
          <div className="Submit-bottom">
            <ValueList
              items={[
                {
                  label: 'Deposit',
                  value: `${String(
                    web3.utils.fromWei(
                      String(
                        web3.utils
                          .toBN(arbitrableTokenListData.data.stake)
                          .add(
                            web3.utils.toBN(
                              arbitrableTokenListData.data.arbitrationCost
                            )
                          )
                      )
                    )
                  )} ETH`,
                  icon: deposit,
                  tooltip:
                    'This is the amount of ETH that you need to submit to cover arbitration fees and reward the counter party if they win a challenge against your submission.'
                }
              ]}
            />
            <br />
            <Button
              onClick={handleSubmitTokenClick}
              disabled={!imageFileDataURL || token.creating}
            >
              {token.creating ? 'Submitting...' : 'Submit Token'}
            </Button>
            <br />
            <small>
              Note this is a <b>security deposit, not a fee,</b> and will be
              refunded if your image is accepted.
            </small>
            <br />
            <small>
              Set an email in <Link to="/settings">settings</Link> to receive
              email notifications.
            </small>
          </div>
        )
      }
      failedLoading="There was an error fetching the list's data."
    />
  </div>
)

Submit.propTypes = {
  // State
  arbitrableTokenListData:
    arbitrableTokenListSelectors.arbitrableTokenListDataShape.isRequired,
  token: tokenSelectors.tokenShape.isRequired,
  imageFileDataURL: PropTypes.string,
  imageFileInfoMessage: PropTypes.node,

  // Handlers
  handleOnFileDropAccepted: PropTypes.func.isRequired,
  handleSubmitTokenClick: PropTypes.func.isRequired
}

Submit.defaultProps = {
  // State
  imageFileDataURL: null,
  imageFileInfoMessage: null
}

export default Submit
