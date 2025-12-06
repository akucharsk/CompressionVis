import { useQuery } from "@tanstack/react-query";
import { apiUrl } from "../utils/urls";
import axios from "axios";
import { defaultRetryPolicy } from "../utils/retryUtils";

export function useIdentity() {
  return useQuery({
    queryKey: ["whoami"],
    queryFn: async () => {
      const response = await axios.get(`${apiUrl}/whoami/`, { withCredentials: true });
      return response.data;
    },
    retry: defaultRetryPolicy,
  });
}
