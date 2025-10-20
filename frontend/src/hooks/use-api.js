import { useQuery } from "@tanstack/react-query";
import { needRetryForThisStatus } from "../utils/urls";
import { MAX_RETRIES } from "../utils/constants";

export function useApi(endpoint, fetchOptions = {}) {
  const queryFn = async () => {
    const resp = await fetch(endpoint, fetchOptions);
    if (!resp.ok || resp.status === 202) {
      const error = new Error();
      error.status = resp.status;
      throw error;
    }
    return await resp.json();
  };

  const retry = (failureCount, error) => {
    const status = error.status || 500;
    if (failureCount < MAX_RETRIES && needRetryForThisStatus(status)) {
      return true;
    }
    if (status === 202) {
      error.message = "Retry limit reached. Please try again later";
    }
    return false;
  };

  return useQuery({
    queryKey: [ endpoint, fetchOptions ],
    queryFn,
    retry
  });
}
