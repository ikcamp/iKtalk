export default function(url, { method, body, headers, ...others } = {}) {
  return fetch( 'https://192.168.37.118:5801' + url, {
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