export default function(url, { method, body, headers, ...others }) {
  return fetch(url, {
    method: method || body ? 'POST' : 'GET',
    body: JSON.stringify(body),
    mode: 'cors',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json; charset=utf-8',
      // 'Content-Type': 'multipart/form-data; charset=utf-8',
      ...headers
    },
    ...others
  })
}