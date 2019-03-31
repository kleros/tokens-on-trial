import React from 'react'
import ReactDOM from 'react-dom'

import configureStore from './bootstrap/configure-store'
import App from './bootstrap/app'
import registerServiceWorker from './bootstrap/register-service-worker'

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

if (module.hot)
  module.hot.accept('./bootstrap/app', () => {
    render(App)
  })
