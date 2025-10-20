import { createContext, useContext } from "react";
import { useSearchParams } from "react-router-dom";
import { apiUrl } from "../utils/urls";
import { useQuery } from "@tanstack/react-query";
import { genericFetch } from "../api/genericFetch";
import { defaultRefetchIntervalPolicy, defaultRetryPolicy } from "../utils/retryUtils";

const MetricsContext = createContext(null);

export const MetricsProvider = ({ children }) => {
  const [ searchParams ] = useSearchParams();
  const videoId = searchParams.get("videoId");

  const videoMetrics = useQuery({
    queryKey: [ "metrics", videoId ],
    queryFn: async () => await genericFetch(`${apiUrl}/metrics/${videoId}`),
    refetchInterval: defaultRefetchIntervalPolicy,
    retry: defaultRetryPolicy
  });

  const frameMetrics = useQuery({
    queryKey: [ "metrics", videoId, "all" ],
    queryFn: async () => await genericFetch(`${apiUrl}/metrics/frames/${videoId}/all`),
    refetchInterval: defaultRefetchIntervalPolicy,
    retry: defaultRetryPolicy
  });

  console.log({ frameMetrics, videoMetrics });

  return (
    <MetricsContext.Provider value={{ videoMetrics, frameMetrics }}>
      { children }
    </MetricsContext.Provider>
  )
}

export const useMetrics = () => {
  const context = useContext(MetricsContext);
  if (!context) {
    throw new Error("useMetrics not called in MetricsProvider");
  }
  return context;
}