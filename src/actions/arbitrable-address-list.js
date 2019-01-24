import { createActions } from 'lessdux'

/* Actions */

// Arbitrable Address List Data
export const arbitrableAddressListData = createActions(
  'ARBITRABLE_ADDRESS_LIST_DATA'
)

/* Action Creators */

// Arbitrable Address List Data
export const fetchArbitrableAddressListData = () => ({
  type: arbitrableAddressListData.FETCH
})
