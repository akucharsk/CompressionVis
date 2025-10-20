
const apiUrl = "http://localhost:8000"

export {apiUrl}

export function needRetryForThisStatus(status) {
  return status in [ 429, 202 ] || status >= 500;
}
