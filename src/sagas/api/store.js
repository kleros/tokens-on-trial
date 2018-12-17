import statusHelper from '../../utils/api-status-helper'
import { FILE_UPLOAD_URL, FILE_BASE_URL } from '../../bootstrap/dapp-api'

const storeApi = {
  postFile(file, fileName, extension = 'json') {
    return fetch(FILE_UPLOAD_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        payload: {
          fileName: `${fileName}.${extension}`,
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
    return fetch(`${FILE_BASE_URL}/${ID}.json`)
      .then(statusHelper)
      .then(response => response.json())
      .catch(err => err)
      .then(data => data)
  }
}

export default storeApi
