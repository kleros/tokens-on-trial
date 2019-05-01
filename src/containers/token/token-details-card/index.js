import React, { useState } from 'react'
import Img from 'react-image'
import PropTypes from 'prop-types'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
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
import { getItemInformation, getRemainingTime } from '../../../utils/ui'

import './token-details-card.css'

const TokenDetailsCard = ({
  token,
  FILE_BASE_URL,
  userAccount,
  arbitrableTokenListData,
  handleActionClick,
  handleExecuteRequestClick,
  fundAppeal,
  badges
}) => {
  const { decisiveRuling, loserHasPaid, appealable } = getItemInformation(
    token,
    userAccount
  )

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

  const badgesCount = Object.keys(badges)
    .map(badgeContractAddr => badges[badgeContractAddr])
    .filter(badgeContractData => badgeContractData.items[token.address])
    .map(badgeContractData => badgeContractData.items[token.address])
    .filter(badge => badge.clientStatus !== tcrConstants.STATUS_ENUM['Absent'])
    .length

  return (
    <div className="TokenDetailsCard">
      <img
        alt="Token Symbol"
        className="TokenDetailsCard-img"
        src={`${
          token.symbolMultihash && token.symbolMultihash[0] === '/'
            ? `${IPFS_URL}`
            : `${FILE_BASE_URL}/`
        }${token.symbolMultihash}`}
      />
      <div className="TokenDetailsCard-card">
        <div className="TokenDetailsCard-card-content">
          <div className="TokenDetailsCard-label">
            <span className="TokenDetailsCard-label-name">{token.name}</span>
            <span className="TokenDetailsCard-label-ticker">
              {token.ticker}
            </span>
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
          </div>
          {appealable ? (
            <div
              style={{
                width: '235px',
                margin: '17px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                borderLeft: '1px solid #CCCCCC',
                padding: '17px'
              }}
            >
              <FontAwesomeIcon
                color="#4d00b4"
                icon="exclamation-triangle"
                style={{
                  width: '30px',
                  height: '30px',
                  margin: '15px',
                  marginTop: 0
                }}
              />
              <p
                style={{
                  color: '#4d00b4',
                  fontSize: '14px',
                  lineHeight: '16px',
                  textAlign: 'center'
                }}
              >
                If the loser complete it’s appeal funding, the winner of the
                previous round should also fully fund the appeal, in order not
                to lose the case.
              </p>
            </div>
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
            href={`https://etherscan.io/token/${token.address}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Img
              className="TokenDetailsCard-icon TokenDetailsCard-meta--aligned"
              src={EtherScanLogo}
            />
            {token.address ? web3Utils.toChecksumAddress(token.address) : ''}
          </a>
          {token.status !== tcrConstants.IN_CONTRACT_STATUS_ENUM['Absent'] && (
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
  arbitrableTokenListData: tcrShape.isRequired,
  handleActionClick: PropTypes.func.isRequired,
  handleExecuteRequestClick: PropTypes.func.isRequired,
  fundAppeal: PropTypes.func.isRequired,
  badges: badgesShape.isRequired
}

export default connect(state => ({
  badges: state.badges.data
}))(TokenDetailsCard)
