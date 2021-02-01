import { call, select, takeLatest } from 'redux-saga/effects'
import * as walletSelectors from '../reducers/wallet'
import * as walletActions from '../actions/wallet'
import { lessduxSaga } from '../utils/saga'
import { instantiateEnvObjects } from '../utils/tcr'

/**
 * Fetches the current wallet's accounts.
 * @returns {string[]} - The accounts.
 */
function* fetchAccounts() {
  if (window.ethereum) {
    const { web3 } = yield call(instantiateEnvObjects)

    yield window.ethereum.enable()
    return yield call(web3.eth.getAccounts)
  } else return []
}

/**
 * Fetches the current wallet's ethereum balance.
 * @returns {string} - The balance.
 */
function* fetchBalance() {
  if (window.ethereum) {
    const { web3 } = yield call(instantiateEnvObjects)
    const balance = yield call(
      web3.eth.getBalance,
      yield select(walletSelectors.getAccount)
    )
    return String(balance)
  }
}

/**
 * The root of the wallet saga.
 */
export default function* walletSaga() {
  // Accounts
  yield takeLatest(
    walletActions.accounts.FETCH,
    lessduxSaga,
    'fetch',
    walletActions.accounts,
    fetchAccounts
  )

  // Balance
  yield takeLatest(
    walletActions.balance.FETCH,
    lessduxSaga,
    'fetch',
    walletActions.balance,
    fetchBalance
  )
}
