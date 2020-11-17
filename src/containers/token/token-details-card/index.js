import React, { useState } from 'react'
import Img from 'react-image'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import * as tcrConstants from '../../../constants/tcr'
import ItemStatus from '../../../components/item-status'
import LatestRuling from '../../../components/latest-ruling'
import PeriodCountdown from '../../../components/period-countdown'
import EtherScanLogo from '../../../assets/images/etherscan.png'
import UserActionCountdown from '../../../components/user-action-countdown'
import ItemActionButton from '../../item-action-button'
import { IPFS_URL, web3Utils } from '../../../bootstrap/dapp-api'
import WaitingBadge from '../../../assets/images/badges/badge-waiting.svg'
import { tcrShape } from '../../../reducers/generic-shapes'
import { badgesShape } from '../../../reducers/badge'
import * as tokenSelectors from '../../../reducers/token'
import {
  getItemInformation,
  getRemainingTime,
  truncateMiddle
} from '../../../utils/ui'
import CrowdfundingMsg from '../../../components/crowdfunding-msg'

import './token-details-card.css'

const TokenDetailsCard = ({
  token,
  FILE_BASE_URL,
  userAccount,
  arbitrableTokenListData,
  handleActionClick,
  handleExecuteRequestClick,
  fundAppeal,
  badges: badgesRes
}) => {
  const badges = badgesRes.data
  const {
    decisiveRuling,
    loserHasPaid,
    appealable,
    payableValue
  } = getItemInformation(token, userAccount)

  const remainingTime = getRemainingTime(
    token,
    arbitrableTokenListData,
    tcrConstants,
    false,
    decisiveRuling
  )

  const remainingLoserTime = getRemainingTime(
    token,
    arbitrableTokenListData,
    tcrConstants,
    true,
    decisiveRuling
  )

  const [appealPeriodEnded, setAppealPeriodEnded] = useState(remainingTime <= 0)
  const [loserTimedOut, setLoserTimedOut] = useState(
    remainingTime <= 0 || (remainingLoserTime <= 0 && !loserHasPaid)
  )

  const { address, latestRequest, name, ticker, symbolMultihash, status } =
    token || {}
  const { parties } = latestRequest || {}

  const badgesCount = Object.keys(badges)
    .map(badgeContractAddr => badges[badgeContractAddr])
    .filter(badgeContractData => badgeContractData.items[address])
    .map(badgeContractData => badgeContractData.items[address])
    .filter(badge => badge.clientStatus !== tcrConstants.STATUS_ENUM['Absent'])
    .length

  return (
    <div className="TokenDetailsCard">
      <img
        alt="Token Symbol"
        className="TokenDetailsCard-img"
        src={`${
          symbolMultihash && symbolMultihash[0] === '/'
            ? `${IPFS_URL}`
            : `${FILE_BASE_URL}/`
        }${symbolMultihash}`}
      />
      <div className="TokenDetailsCard-card">
        <div className="TokenDetailsCard-card-content">
          <div className="TokenDetailsCard-label">
            <span className="TokenDetailsCard-label-name">{name}</span>
            <span className="TokenDetailsCard-label-ticker">{ticker}</span>
          </div>
          <div className="TokenDetailsCard-divider" />
          <div className="TokenDetailsCard-meta">
            <ItemStatus item={token} />
            <LatestRuling item={token} userAccount={userAccount} />
            <PeriodCountdown item={token} tcr={arbitrableTokenListData} />
            <UserActionCountdown
              item={token}
              userAccount={userAccount}
              tcrData={arbitrableTokenListData}
              onAppealPeriodEnd={setAppealPeriodEnded}
              onLoserTimedOut={setLoserTimedOut}
            />
            <div style={{ margin: '10px 35px' }}>
              Requester:
              <a
                href={`https://etherscan.io/address/${parties[1]}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ marginLeft: '12px', color: '#4a4a4a' }}
              >
                {truncateMiddle(parties[1])}
              </a>
            </div>
          </div>
          {appealable &&
          (!decisiveRuling || !loserTimedOut) &&
          remainingTime > 0 ? (
            <CrowdfundingMsg
              decisiveRuling={decisiveRuling}
              payableValue={payableValue}
              type="Token"
            />
          ) : (
            <div className="TokenDetailsCard-actionWrapper">
              <ItemActionButton
                item={token}
                userAccount={userAccount}
                tcr={arbitrableTokenListData}
                fundAppeal={fundAppeal}
                handleActionClick={handleActionClick}
                handleExecuteRequestClick={handleExecuteRequestClick}
                appealPeriodEnded={appealPeriodEnded}
                loserTimedOut={loserTimedOut}
              />
            </div>
          )}
        </div>
        <div className="TokenDetailsCard-footer">
          <a
            className="TokenDetailsCard--link"
            style={{ marginRight: '14px' }}
            href={`https://etherscan.io/token/${address}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Img
              className="TokenDetailsCard-icon TokenDetailsCard-meta--aligned"
              src={EtherScanLogo}
            />
            {address ? web3Utils.toChecksumAddress(address) : ''}
          </a>
          {status !== tcrConstants.IN_CONTRACT_STATUS_ENUM['Absent'] && (
            <span className="TokenDetailsCard-footer-badge">
              <span
                className="TokenDetailsCard-icon-badge TokenDetailsCard-meta--aligned"
                style={{
                  backgroundImage: `url(${WaitingBadge})`,
                  color: '#656565'
                }}
              >
                {badgesCount}
              </span>
              Badge(s)
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

TokenDetailsCard.propTypes = {
  token: tokenSelectors._tokenShape.isRequired,
  FILE_BASE_URL: PropTypes.string.isRequired,
  userAccount: PropTypes.string.isRequired,
  arbitrableTokenListData: tcrShape,
  handleActionClick: PropTypes.func.isRequired,
  handleExecuteRequestClick: PropTypes.func.isRequired,
  fundAppeal: PropTypes.func.isRequired,
  badges: badgesShape.isRequired
}

TokenDetailsCard.defaultProps = {
  arbitrableTokenListData: null
}

export default connect(state => ({
  badges: state.badges
}))(TokenDetailsCard)
