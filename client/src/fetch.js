import config from './config'
const { httpServer, httpsServer } = config

export default function(url, { method, body, headers, ...others } = {}) {
  return fetch(`${httpServer}${url}`, {
    method: method || (body ? 'POST' : 'GET'),
    body: JSON.stringify(body),
    mode: 'cors',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json; charset=utf-8',
      ...headers
    },
    ...others
  })
}