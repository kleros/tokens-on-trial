import { createActions } from 'lessdux'

/* Actions */

// Arbitrable Address List Data
export const arbitrableAddressListData = createActions(
  'ARBITRABLE_ADDRESS_LIST_DATA'
)
export const fetchArbitrableAddressListData = () => ({
  type: arbitrableAddressListData.FETCH,
})

// Evidence submission
export const badgeEvidence = {
  ...createActions('BADGE_EVIDENCE', { withCreate: true }),
}
export const submitBadgeEvidence = ({
  file,
  evidenceData,
  tokenAddress,
  badgeContractAddr,
  evidenceSide,
}) => ({
  type: badgeEvidence.CREATE,
  payload: {
    file,
    evidenceData,
    tokenAddress,
    badgeContractAddr,
    evidenceSide,
  },
})
