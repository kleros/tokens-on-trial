import { web3, STORE_AWS_PROVIDER } from '../../bootstrap/dapp-api'
import statusHelper from '../../utils/api-status-helper'

const storeApi = {
  postFile(file) {
    return fetch(STORE_AWS_PROVIDER, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payload: {
          fileName: `${web3.utils.sha3(file)}.json`,
          base64EncodedData: btoa(file)
        }
      })
    })
      .then(statusHelper)
      .then(response => response.json())
      .catch(err => err)
      .then(data => data)
  }
}

export default storeApi
