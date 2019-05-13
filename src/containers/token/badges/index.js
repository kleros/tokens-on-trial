import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { BeatLoader } from 'react-spinners'

import { onlyInfura } from '../../../bootstrap/dapp-api'
import Button from '../../../components/button'
import BadgeCard from '../../../components/badge-card'
import {
  itemShape,
  cacheItemShape,
  tcrShape
} from '../../../reducers/generic-shapes'
import * as tcrConstants from '../../../constants/tcr'
import * as modalActions from '../../../actions/modal'
import * as modalConstants from '../../../constants/modal'

import './badges.css'

const BadgesSection = ({
  token: { status, address },
  openActionModal,
  badges,
  arbitrableAddressListData
}) => {
  const displayedBadges = Object.keys(badges)
    .map(badgeContractAddr => badges[badgeContractAddr])
    .filter(badgeContractData => badgeContractData.items[address])
    .map(badgeContractData => badgeContractData.items[address])
    .filter(badge => badge.clientStatus !== tcrConstants.STATUS_ENUM['Absent'])

  /* eslint-disable react/jsx-no-bind */

  return (
    <div className="TokenDescription">
      <div className="Badges-badge-header">
        <h3 style={{ marginTop: 0 }}>Badges</h3>
        {(status === tcrConstants.IN_CONTRACT_STATUS_ENUM['Registered'] ||
          status ===
            tcrConstants.IN_CONTRACT_STATUS_ENUM['ClearingRequested']) &&
          displayedBadges.length < Object.keys(badges).length && (
            <Button
              tooltip={onlyInfura ? 'Please install MetaMask.' : null}
              disabled={onlyInfura}
              onClick={() =>
                openActionModal(
                  modalConstants.ACTION_MODAL_ENUM.AddBadge,
                  displayedBadges.map(b => b.badgeContractAddr)
                )
              }
              type="secondary"
              style={{ width: '117px' }}
            >
              Add Badge
            </Button>
          )}
        {status !== tcrConstants.IN_CONTRACT_STATUS_ENUM['Registered'] &&
          status !==
            tcrConstants.IN_CONTRACT_STATUS_ENUM['ClearingRequested'] && (
            <span className="Badges-info">
              Tokens must be registered to receive badges.
            </span>
          )}
      </div>
      {status !== tcrConstants.STATUS_ENUM['Absent'] && ( // Don't show badges if token is absent.
        <div className="Badges-cards">
          {arbitrableAddressListData.loading ||
          !arbitrableAddressListData.data ? (
            <div style={{ marginLeft: '17px' }}>
              <BeatLoader color="#3d464d" />
            </div>
          ) : (
            displayedBadges.map(badge => (
              <BadgeCard
                badge={badge}
                key={`${badge.badgeContractAddr}.${address}`}
                arbitrableAddressListData={arbitrableAddressListData.data}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}

BadgesSection.propTypes = {
  token: itemShape.isRequired,
  openActionModal: PropTypes.func.isRequired,
  badges: PropTypes.objectOf(cacheItemShape.isRequired).isRequired,
  arbitrableAddressListData: tcrShape.isRequired
}

export default connect(
  state => ({
    badges: state.badges.data,
    arbitrableAddressListData:
      state.arbitrableAddressList.arbitrableAddressListData
  }),
  {
    openActionModal: modalActions.openActionModal
  }
)(BadgesSection)
