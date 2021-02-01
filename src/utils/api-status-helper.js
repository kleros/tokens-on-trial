/**
 * Checkes status.
 * @param {object} response - The http response.
 * @returns {object} - The response.
 */
export default function statusHelper(response) {
  return response.status >= 200 && response.status < 300
    ? Promise.resolve(response)
    : Promise.reject(new Error(response.statusText))
}
