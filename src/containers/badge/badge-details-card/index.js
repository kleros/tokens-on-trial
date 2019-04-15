import React, { useState } from 'react'
import Img from 'react-image'
import PropTypes from 'prop-types'

import LatestRuling from '../../../components/latest-ruling'
import CrowdfundingProgress from '../../../components/crowdfunding-prog'
import { web3Utils, IPFS_URL } from '../../../bootstrap/dapp-api'
import Etherscan from '../../../assets/images/etherscan.png'
import ItemStatus from '../../../components/item-status'
import PeriodCountdown from '../../../components/period-countdown'
import UserActionCountdown from '../../../components/user-action-countdown'
import ItemActionButton from '../../item-action-button'
import { truncateMiddle } from '../../../utils/ui'
import { itemShape, tcrShape } from '../../../reducers/generic-shapes'
import { arbitrableAddressListDataShape } from '../../../reducers/arbitrable-address-list'

const BadgeDetailsCard = ({
  badge,
  userAccount,
  tcr,
  tcrData,
  handleActionClick,
  handleExecuteRequestClick,
  fundAppeal
}) => {
  const {
    variables: { title, description, symbolURI, criteriaDescription },
    fileURI
  } = tcrData
  const [challengePeriodCompleted, setChallengePeriodCompleted] = useState(
    false
  )
  const [appealPeriodEnded, setAppealPeriodEnded] = useState(false)
  const [loserTimedOut, setLoserTimedOut] = useState(false)
  const { tokenAddress } = badge

  return (
    <div className="BadgeDetails">
      <div className="BadgeDetails-card">
        <div className="BadgeDetails-card-content">
          <Img className="BadgeDetails-img" src={`${IPFS_URL}${symbolURI}`} />
          <div className="BadgeDetails-divider" />
          <div className="BadgeDetails-description">
            <div>
              <h4 style={{ margin: '0px' }}>Badge Description</h4>
              <p style={{ lineHeight: '1.5', marginTop: '10px' }}>
                {description}
              </p>
              <p style={{ lineHeight: '1.5', marginTop: '10px' }}>
                {criteriaDescription}
              </p>
              <p style={{ lineHeight: '1.5', marginTop: '10px' }}>
                See{' '}
                <a
                  className="TokenDetails-withdraw"
                  target="_blank"
                  rel="noopener noreferrer"
                  href={`${IPFS_URL}${fileURI}`}
                  style={{ margin: 0, textDecoration: 'underline' }}
                >
                  Listing Criteria
                </a>
                .
              </p>
            </div>
            <div className="BadgeDetails-description-status">
              <LatestRuling item={badge} userAccount={userAccount} />
              <PeriodCountdown item={badge} />
              <UserActionCountdown
                item={badge}
                userAccount={userAccount}
                tcrData={tcrData}
                onAppealPeriodEnd={setAppealPeriodEnded}
                onLoserTimedout={setLoserTimedOut}
                onChallengePeriodEnd={setChallengePeriodCompleted}
              />
            </div>
          </div>
          <CrowdfundingProgress item={badge} userAccount={userAccount} />
        </div>
        <div className="BadgeDetails-footer">
          <div className="BadgeDetails-footer-short">
            {`Compliant With \n ${title} Criteria`}
          </div>
          <div
            className="BadgeDetails-footer-short-divider"
            style={{ height: '20px' }}
          />
          <ItemStatus item={badge} />
          <div className="BadgeDetails-meta">
            <span
              className="BadgeDetails-meta--aligned BadgeDetails-timer"
              style={{
                display: 'flex',
                alignItems: 'center',
                color: '#3d464d'
              }}
            >
              <a
                className="BadgeDetails--link"
                href={`https://etherscan.io/address/${tokenAddress}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <div
                  className="BadgeDetails-meta--aligned"
                  style={{ display: 'flex', alignItems: 'center' }}
                >
                  <Img
                    className="BadgeDetails-icon BadgeDetails-meta--aligned"
                    src={Etherscan}
                  />
                  <div style={{ marginRight: '14px' }}>
                    {truncateMiddle(web3Utils.toChecksumAddress(tokenAddress))}
                  </div>
                </div>
              </a>
            </span>
          </div>
          <ItemActionButton
            item={badge}
            userAccount={userAccount}
            tcr={tcrData}
            fundAppeal={fundAppeal}
            handleActionClick={handleActionClick}
            handleExecuteRequestClick={handleExecuteRequestClick}
            appealPeriodEnded={appealPeriodEnded}
            challendePeriodEnded={challengePeriodCompleted}
            loserTimedOut={loserTimedOut}
            badgeContractAddr={tcr.options.address}
          />
        </div>
      </div>
    </div>
  )
}

BadgeDetailsCard.propTypes = {
  badge: itemShape.isRequired,
  userAccount: PropTypes.string.isRequired,
  tcr: tcrShape.isRequired,
  handleActionClick: PropTypes.func.isRequired,
  handleExecuteRequestClick: PropTypes.func.isRequired,
  fundAppeal: PropTypes.func.isRequired,
  tcrData: arbitrableAddressListDataShape.isRequired
}

export default BadgeDetailsCard
