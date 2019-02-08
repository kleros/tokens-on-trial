import React from 'react'
import ReactDOM from 'react-dom'

import configureStore from './bootstrap/configure-store'
import App from './bootstrap/app'
import registerServiceWorker from './bootstrap/register-service-worker'
import {
  arbitrableTokenList,
  arbitrableAddressList
} from './bootstrap/dapp-api'

const { store, history } = configureStore()
export default store

const render = Component => {
  ReactDOM.render(
    <Component
      history={history}
      key={process.env.NODE_ENV === 'development' ? Math.random() : undefined}
      store={store}
    />,
    document.getElementById('root')
  )
}
render(App)
registerServiceWorker()

window.addEventListener('unload', () => {
  localStorage.setItem(
    `${arbitrableTokenList.options.address +
      arbitrableAddressList.options.address}notifications`,
    JSON.stringify(store.getState().notification.notifications.data)
  )
  localStorage.setItem(
    `${arbitrableTokenList.options.address}filter`,
    JSON.stringify(store.getState().filter)
  )
})

if (module.hot)
  module.hot.accept('./bootstrap/app', () => {
    render(App)
  })
