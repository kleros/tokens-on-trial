import { createActions } from 'lessdux'

/* Actions */

// Arbitrable Token List Data
export const arbitratorData = createActions('ARBITRATOR_DATA')

/* Action Creators */

// Arbitrator Data
export const fetchArbitratorData = () => ({
  type: arbitratorData.FETCH
})
