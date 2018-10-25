import { createActions } from 'lessdux'

/* Actions */

// Arbitrable Token List Data
export const arbitrableTokenListData = createActions(
  'ARBITRABLE_TOKEN_LIST_DATA'
)

/* Action Creators */

// Arbitrable Token List Data
export const fetchArbitrableTokenListData = () => ({
  type: arbitrableTokenListData.FETCH
})
