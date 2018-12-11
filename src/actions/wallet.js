import { createActions } from 'lessdux'

/* Actions */

// Accounts
export const accounts = createActions('ACCOUNTS')

// Balance
export const balance = createActions('BALANCE')

/* Action Creators */

// Settings
export const updateSettings = ({ settings }) => ({
  type: settings.UPDATE_SETTINGS,
  payload: { settings }
})

// Accounts
export const fetchAccounts = () => ({ type: accounts.FETCH })

// Balance
export const fetchBalance = () => ({ type: balance.FETCH })
