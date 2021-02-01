import statusHelper from '../../utils/api-status-helper'

const storeApi = {
  postJSONFile(file, url, archon) {
    const stringified = JSON.stringify(file)
    const base64EncodedData = `data:application/json;base64,${btoa(
      stringified
    )}`
    /* eslint-disable unicorn/number-literal-case */
    const fileName = archon.utils.multihashFile(
      base64EncodedData,
      0x1b // keccak-256
    )
    /* eslint-enable */
    const body = JSON.stringify({
      payload: {
        fileName,
        base64EncodedData,
      },
    })

    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body,
    })
      .then(statusHelper)
      .then((response) => response.json())
      .catch((err) => err)
      .then((data) => data)
  },
  postEncodedFile(file, fileName, contentType, url) {
    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': contentType,
      },
      body: JSON.stringify({
        payload: {
          fileName: `${fileName}`,
          base64EncodedData: file,
        },
      }),
    })
      .then(statusHelper)
      .then((response) => response.json())
      .catch((err) => err)
      .then((data) => data)
  },

  getFile(ID, url) {
    return fetch(`${url}/${ID}.json`)
      .then(statusHelper)
      .then((response) => response.json())
      .catch((err) => err)
      .then((data) => data)
  },
}

export default storeApi
