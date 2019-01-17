import statusHelper from '../../utils/api-status-helper'
import {
  FILE_UPLOAD_URL,
  FILE_BASE_URL,
  archon
} from '../../bootstrap/dapp-api'

const storeApi = {
  postJSONFile(file) {
    const stringified = JSON.stringify(file)
    const base64EncodedData =
      'data:application/json;base64,' + btoa(stringified)
    /* eslint-disable unicorn/number-literal-case */
    const fileName = archon.utils.multihashFile(
      base64EncodedData,
      0x1b // keccak-256
    )
    /* eslint-enable */
    const body = JSON.stringify({
      payload: {
        fileName,
        base64EncodedData
      }
    })

    return fetch(FILE_UPLOAD_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body
    })
      .then(statusHelper)
      .then(response => response.json())
      .catch(err => err)
      .then(data => data)
  },
  postEncodedFile(file, fileName, contentType) {
    return fetch(FILE_UPLOAD_URL, {
      method: 'POST',
      headers: {
        'Content-Type': contentType
      },
      body: JSON.stringify({
        payload: {
          fileName: `${fileName}`,
          base64EncodedData: file
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
