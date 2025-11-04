export async function genericFetch(url, fetchOptions = {}) {
  try {
    const resp = await fetch(url, fetchOptions);
    if (!resp.ok) {
      let message;
      const defaultMessage = `Failed to fetch metrics for this video. Received status code ${resp.status}`;
      try {
        const data = await resp.json();
        message = data.message || defaultMessage;
      } catch(_) {
        message = defaultMessage;
      }
      const error = new Error(message);
      error.status = resp.status;
      throw error;
    }
    return await resp.json();
  } catch(error) {
    error.status = error.status || 500;
    throw error;
  }
}