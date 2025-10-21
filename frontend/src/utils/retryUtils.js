import { DEFAULT_RETRY_TIMEOUT_MS, MAX_RETRIES } from "./constants";
import { needRetryForThisStatus } from "./urls";

export function defaultRetryPolicy(failureCount, error) {
  const status = error?.status || 500;
  return failureCount < MAX_RETRIES && needRetryForThisStatus(status);
}

export function defaultRefetchIntervalPolicy(query) {
  return query?.state?.data?.message === "processing" ? DEFAULT_RETRY_TIMEOUT_MS : false;
}
