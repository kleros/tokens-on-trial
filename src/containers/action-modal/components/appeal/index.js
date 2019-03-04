import React from 'react'
import PropTypes from 'prop-types'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import { connect } from 'react-redux'

import * as tokenSelectors from '../../../../reducers/token'
import * as tcrConstants from '../../../../constants/tcr'
import * as arbitrableTokenListSelectors from '../../../../reducers/arbitrable-token-list'
import * as arbitrableAddressListSelectors from '../../../../reducers/arbitrable-address-list'
import { web3 } from '../../../../bootstrap/dapp-api'
import Button from '../../../../components/button'

import { AppealForm, getAppealFormIsInvalid, submitAppealForm } from './form'
import './appeal.css'

const isLosingSide = (item, side) => {
  const { latestRequest } = item
  let losingSide = false
  if (
    Number(side) === tcrConstants.SIDE.Requester &&
    latestRequest.dispute.ruling === tcrConstants.RULING_OPTIONS.Refuse
  )
    losingSide = true
  else if (
    Number(side) === tcrConstants.SIDE.Challenger &&
    latestRequest.dispute.ruling === tcrConstants.RULING_OPTIONS.Accept
  )
    losingSide = true

  return losingSide
}

const decisiveRuling = item =>
  item.latestRequest.dispute.ruling !== tcrConstants.RULING_OPTIONS.None

const FundAppeal = ({
  closeActionModal,
  fundAppeal,
  item,
  tcr,
  side,
  appealFormIsInvalid,
  submitAppealForm
}) => (
  <>
    <h3 className="Modal-title">
      <FontAwesomeIcon className="Appeal-icon" icon="gavel" />
      Appeal
    </h3>
    <hr />
    <h5 className="Modal-subtitle">
      In order to appeal, the following <br /> amount of ETH is required
    </h5>
    <div className="Appeal-cost">
      <span>Appeal Cost</span>
      {`${item.latestRequest.latestRound.appealCost &&
        String(
          web3.utils.fromWei(item.latestRequest.latestRound.appealCost)
        )} ETH`}
    </div>
    <div className="Appeal-cost">
      <span>Arbitration Fee Stake</span>
      {`${String(
        item.latestRequest.latestRound.appealCost &&
          web3.utils.fromWei(
            String(
              web3.utils
                .toBN(String(item.latestRequest.latestRound.appealCost))
                .mul(
                  web3.utils.toBN(
                    !decisiveRuling(item)
                      ? String(tcr.data.sharedStakeMultiplier)
                      : isLosingSide(item, side)
                      ? String(tcr.data.loserStakeMultiplier)
                      : String(tcr.data.winnerStakeMultiplier)
                  )
                )
                .div(web3.utils.toBN(String(tcr.data.MULTIPLIER_DIVISOR)))
            )
          )
      )} ETH `}
    </div>
    <div className="Appeal-cost">
      <span>Total Required:</span>
      {`${String(
        item.latestRequest.latestRound.appealCost &&
          web3.utils.fromWei(
            String(
              web3.utils
                .toBN(String(item.latestRequest.latestRound.appealCost))
                .add(
                  web3.utils
                    .toBN(String(item.latestRequest.latestRound.appealCost))
                    .mul(
                      web3.utils.toBN(
                        !decisiveRuling(item)
                          ? String(tcr.data.sharedStakeMultiplier)
                          : isLosingSide(item, side)
                          ? String(tcr.data.loserStakeMultiplier)
                          : String(tcr.data.winnerStakeMultiplier)
                      )
                    )
                    .div(web3.utils.toBN(String(tcr.data.MULTIPLIER_DIVISOR)))
                )
            )
          )
      )} ETH `}
    </div>
    <div className="Appeal-cost">
      <span>Amount Paid:</span>
      {`${String(
        web3.utils.fromWei(
          String(
            web3.utils.toBN(
              String(item.latestRequest.latestRound.paidFees[side])
            )
          )
        )
      )} ETH `}
    </div>
    <br />
    <div className="Appeal-cost">
      <span>Amount Still Required:</span>
      <strong className="Appeal-total-value">
        {`${String(
          item.latestRequest.latestRound.appealCost &&
            web3.utils.fromWei(
              String(
                web3.utils
                  .toBN(String(item.latestRequest.latestRound.appealCost))
                  .add(
                    web3.utils
                      .toBN(String(item.latestRequest.latestRound.appealCost))
                      .mul(
                        web3.utils.toBN(
                          !decisiveRuling(item)
                            ? String(tcr.data.sharedStakeMultiplier)
                            : isLosingSide(item, side)
                            ? String(tcr.data.loserStakeMultiplier)
                            : String(tcr.data.winnerStakeMultiplier)
                        )
                      )
                      .div(web3.utils.toBN(String(tcr.data.MULTIPLIER_DIVISOR)))
                  )
                  .sub(
                    web3.utils.toBN(
                      String(item.latestRequest.latestRound.paidFees[side])
                    )
                  )
              )
            )
        )} ETH `}
      </strong>
    </div>
    <AppealForm
      className="Challenge-form"
      onSubmit={fundAppeal}
      initialValues={{
        amount: !item.latestRequest.latestRound.appealCost
          ? 0
          : web3.utils
              .fromWei(
                String(
                  web3.utils
                    .toBN(String(item.latestRequest.latestRound.appealCost))
                    .add(
                      web3.utils
                        .toBN(String(item.latestRequest.latestRound.appealCost))
                        .mul(
                          web3.utils.toBN(
                            !decisiveRuling(item)
                              ? String(tcr.data.loserStakeMultiplier)
                              : isLosingSide(item, side)
                              ? String(tcr.data.loserStakeMultiplier)
                              : String(tcr.data.winnerStakeMultiplier)
                          )
                        )
                        .div(
                          web3.utils.toBN(String(tcr.data.MULTIPLIER_DIVISOR))
                        )
                    )
                    .sub(
                      web3.utils.toBN(
                        String(item.latestRequest.latestRound.paidFees[side])
                      )
                    )
                )
              )
              .toString()
      }}
    />
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
          Note: This is not a fee, it is a deposit and will be refunded if you
          are correct.
        </i>
      </div>
    </div>
    <br />
    <div className="Modal-actions">
      <Button
        className="Appeal-return"
        onClick={closeActionModal}
        type="secondary"
      >
        Cancel
      </Button>
      <Button
        className="Appeal-request"
        onClick={submitAppealForm}
        disabled={appealFormIsInvalid}
        type="primary"
      >
        Fund Appeal
      </Button>
    </div>
  </>
)

FundAppeal.propTypes = {
  // State
  item: tokenSelectors.tokenShape.isRequired,
  tcr: PropTypes.oneOfType([
    arbitrableTokenListSelectors.arbitrableTokenListDataShape,
    arbitrableAddressListSelectors.arbitrableAddressListDataShape
  ]).isRequired,
  side: PropTypes.string.isRequired,
  appealFormIsInvalid: PropTypes.bool.isRequired,

  // Action Dispatchers
  closeActionModal: PropTypes.func.isRequired,
  fundAppeal: PropTypes.func.isRequired,
  submitAppealForm: PropTypes.func.isRequired
}

export default connect(
  state => ({
    appealFormIsInvalid: getAppealFormIsInvalid(state)
  }),
  {
    submitAppealForm
  }
)(FundAppeal)
