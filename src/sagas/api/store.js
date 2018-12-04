import statusHelper from '../../utils/api-status-helper'
import {
  web3,
  TOKEN_UPLOAD_URL,
  TOKEN_BASE_URL
} from '../../bootstrap/dapp-api'

const storeApi = {
  postFile(file) {
    return fetch(TOKEN_UPLOAD_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
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
  },
  getFile(ID) {
    return fetch(`${TOKEN_BASE_URL}/${ID}.json`)
      .then(statusHelper)
      .then(response => response.json())
      .catch(err => err)
      .then(data => data)
  }
}

export default storeApi
