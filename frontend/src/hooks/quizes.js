import { useQuery } from "@tanstack/react-query";
import { defaultRetryPolicy } from "../utils/retryUtils";
import { defaultRefetchIntervalPolicy } from "../utils/retryUtils";
import { genericFetch } from "../api/genericFetch";
import { apiUrl } from "../utils/urls";

export function useQuizes() {
  return useQuery({
    queryKey: ["quizes"],
    queryFn: async () => await genericFetch(`${apiUrl}/quizes`),
    retry: defaultRetryPolicy,
    refetchInterval: defaultRefetchIntervalPolicy,
  })
}
