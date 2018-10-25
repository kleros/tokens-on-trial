import React from 'react'
import PropTypes from 'prop-types'
import { RenderIf } from 'lessdux'
import { Link } from 'react-router-dom'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import { BeatLoader } from 'react-spinners'

import { web3, isInfura, IMAGES_BASE_URL } from '../../../../bootstrap/dapp-api'
import * as arbitrableTokenListSelectors from '../../../../reducers/arbitrable-token-list'
import * as tokenSelectors from '../../../../reducers/token'
import * as tokenConstants from '../../../../constants/token'
import InfoCard from '../../../../components/info-card'
import TokenImage from '../../../../components/token-image'
import ValueList from '../../../../components/value-list'
import Button from '../../../../components/button'
import deposit from '../../../../assets/images/deposit.svg'
import appealFees from '../../../../assets/images/appeal-fees.svg'

import './details.css'

const renderTokenDetails = (
  arbitrableTokenListData,
  token,
  onExecuteRequestClick,
  onSubmitChallengeClick,
  onAppealClick
) => {
  let status = token.status
  let infoCardMessage
  let title
  let titleTooltip
  let valueListItems
  let button
  switch (token.status) {
    case tokenConstants.STATUS_ENUM.Pending: // You can challenge the token
      if (
        Date.now() - token.lastAction >=
        arbitrableTokenListData.timeToChallenge
      ) {
        title = 'Ready to Execute'
        titleTooltip =
          'Press the button and the image will be added to the list.'
        button = {
          children: 'Finalize Registration',
          onClick: onExecuteRequestClick
        }
      } else {
        title = 'Should This Image Go to Trial?'
        titleTooltip =
          'Think this image is not a Token? Send the suspect to court!'
        valueListItems = [
          {
            label: 'Deposit',
            value: `${String(
              web3.utils.fromWei(
                String(
                  web3.utils
                    .toBN(arbitrableTokenListData.stake)
                    .add(
                      web3.utils.toBN(arbitrableTokenListData.arbitrationCost)
                    )
                )
              )
            )} ETH`,
            icon: deposit,
            tooltip:
              'This is the amount of ETH that you need to submit to cover arbitration fees and reward the counter party if they win.'
          }
        ]
        button = {
          children: 'Send to Trial!',
          onClick: onSubmitChallengeClick
        }
      }
      break
    case tokenConstants.STATUS_ENUM.Challenged: // The token has an ongoing challenge
      switch (token.disputeStatus) {
        case tokenConstants.DISPUTE_STATUS_ENUM.Waiting: // The dispute is waiting for a ruling
          title = 'This Image Is Under Trial!'
          titleTooltip =
            'Kleros jurors are deciding whether this is a Token or not.'
          valueListItems = [
            {
              label: 'At Stake',
              value: `${String(
                web3.utils.fromWei(
                  String(
                    web3.utils
                      .toBN(arbitrableTokenListData.stake)
                      .add(
                        web3.utils.toBN(arbitrableTokenListData.arbitrationCost)
                      )
                      .muln(2)
                  )
                )
              )} ETH`,
              icon: deposit,
              tooltip:
                'This is the total amount of ETH submitted by both parties. It will be used to pay arbitration fees and the remaining amount will go to the winner.'
            }
          ]
          break
        case tokenConstants.DISPUTE_STATUS_ENUM.Appealable: // You can appeal the dispute's ruling
          status =
            tokenConstants.STATUS_ENUM[
              tokenConstants.RULING_ENUM[token.currentRuling]
            ]
          title = 'Appeal?'
          titleTooltip =
            'You think the verdict was unfair? Every image has the right to a new trial!'
          valueListItems = [
            {
              label: 'At Stake',
              value: `${String(
                web3.utils.fromWei(
                  String(
                    web3.utils
                      .toBN(arbitrableTokenListData.stake)
                      .add(
                        web3.utils.toBN(arbitrableTokenListData.arbitrationCost)
                      )
                      .muln(2)
                  )
                )
              )} ETH`,
              icon: deposit,
              tooltip:
                'This is the total amount of ETH submitted by both parties. It will be used to pay arbitration fees and the remaining amount will go to the winner.'
            },
            {
              label: 'Appeal Fees',
              value: `${String(web3.utils.fromWei(token.appealCost))} ETH`,
              icon: appealFees,
              tooltip: 'This is the cost of appealing the ruling, in ETH.'
            }
          ]
          button = { children: 'Appeal', onClick: onAppealClick }
          break
        case tokenConstants.DISPUTE_STATUS_ENUM.Solved: // You can execute the dispute's ruling
          status =
            tokenConstants.STATUS_ENUM[
              tokenConstants.RULING_ENUM[token.currentRuling]
            ]
          title = 'Pending Ruling Execution'
          titleTooltip =
            'The dispute brought against this image has been resolved and is pending execution.'
          valueListItems = [
            {
              label: 'At Stake',
              value: `${String(
                web3.utils.fromWei(
                  String(
                    web3.utils
                      .toBN(arbitrableTokenListData.stake)
                      .add(
                        web3.utils.toBN(arbitrableTokenListData.arbitrationCost)
                      )
                      .muln(2)
                  )
                )
              )} ETH`,
              icon: deposit,
              tooltip:
                'This is the total amount of ETH submitted by both parties. It will be used to pay arbitration fees and the remaining amount will go to the winner.'
            }
          ]
          break
        default:
          throw new Error('Invalid token challenged state.')
      }
      break
    case tokenConstants.STATUS_ENUM.Accepted: // The token has been accepted
      title = 'Innocent, Your Honor!'
      titleTooltip = 'The jury decided this image is a Token. It was accepted.'
      break
    case tokenConstants.STATUS_ENUM.Rejected: // The token has been rejected
      title = 'Guilty, Your Honor!'
      titleTooltip =
        'The jury decided this image is not a Token. It was rejected.'
      break
    default:
      throw new Error('Invalid token state.')
  }
  return (
    <div className="Details">
      {infoCardMessage && <InfoCard message={infoCardMessage} />}
      {title && (
        <h1>
          {title}
          {titleTooltip && (
            <FontAwesomeIcon
              icon="info-circle"
              className="Details-titleTooltip"
              data-tip={titleTooltip}
            />
          )}
        </h1>
      )}
      <TokenImage status={status} imageSrc={IMAGES_BASE_URL + token.ID} />
      {valueListItems && (
        <ValueList items={valueListItems} className="Details-valueList" />
      )}
      {button && (
        <Button
          id={token.ID}
          tooltip={isInfura ? 'Please install MetaMask.' : null}
          disabled={isInfura}
          className="Details-button"
          {...button}
        />
      )}
      <br />
      <small>
        Set an email in <Link to="/settings">settings</Link> to receive email
        notifications.
      </small>
    </div>
  )
}
const Details = ({
  arbitrableTokenListData,
  token,
  onExecuteRequestClick,
  onSubmitChallengeClick,
  onAppealClick,
  onExecuteRulingClick
}) => (
  <RenderIf
    resource={arbitrableTokenListData}
    loading={<BeatLoader color="#3d464d" />}
    done={
      arbitrableTokenListData.data && (
        <RenderIf
          resource={token}
          loading={<BeatLoader color="#3d464d" />}
          updating={<BeatLoader color="#3d464d" />}
          done={
            token.data &&
            !token.updating &&
            renderTokenDetails(
              arbitrableTokenListData.data,
              token.data,
              onExecuteRequestClick,
              onSubmitChallengeClick,
              onAppealClick,
              onExecuteRulingClick
            )
          }
          failedLoading="There was an error fetching the token."
          failedUpdating="There was an error updating the token."
        />
      )
    }
    failedLoading="There was an error fetching the list data."
  />
)

Details.propTypes = {
  // State
  arbitrableTokenListData:
    arbitrableTokenListSelectors.arbitrableTokenListDataShape.isRequired,
  token: tokenSelectors.tokenShape.isRequired,

  // Handlers
  onExecuteRequestClick: PropTypes.func.isRequired,
  onSubmitChallengeClick: PropTypes.func.isRequired,
  onAppealClick: PropTypes.func.isRequired,
  onExecuteRulingClick: PropTypes.func.isRequired
}

export default Details
