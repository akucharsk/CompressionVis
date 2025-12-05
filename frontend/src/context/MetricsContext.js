import { createContext, useContext } from "react";
import {useLocation, useSearchParams} from "react-router-dom";
import { apiUrl } from "../utils/urls";
import { useQuery } from "@tanstack/react-query";
import { genericFetch } from "../api/genericFetch";
import { defaultRefetchIntervalPolicy, defaultRetryPolicy } from "../utils/retryUtils";

const MetricsContext = createContext(null);

export const MetricsProvider = ({ children }) => {
  const [ searchParams ] = useSearchParams();
  const videoId = searchParams.get("videoId");
  const location = useLocation();
  const isExcludedPath = location.pathname === "/differences";

  const videoMetricsQuery = useQuery({
    queryKey: [ "metrics", videoId ],
    queryFn: async () => await genericFetch(`${apiUrl}/metrics/${videoId}`),
    refetchInterval: defaultRefetchIntervalPolicy,
    retry: defaultRetryPolicy,
    enabled: !!videoId && !isExcludedPath
  });

  videoMetricsQuery.isPending = videoMetricsQuery.isPending || videoMetricsQuery.data?.message === "processing";

  const frameMetricsQuery = useQuery({
    queryKey: [ "metrics", videoId, "all" ],
    queryFn: async () => await genericFetch(`${apiUrl}/metrics/frames/${videoId}/all`),
    refetchInterval: defaultRefetchIntervalPolicy,
    retry: defaultRetryPolicy,
    enabled: !!videoId && !isExcludedPath
  });

  frameMetricsQuery.isPending = frameMetricsQuery.isPending || frameMetricsQuery.data?.message === "processing";

  return (
    <MetricsContext.Provider value={{ videoMetricsQuery, frameMetricsQuery }}>
      { children }
    </MetricsContext.Provider>
  );
}

export const useMetrics = () => {
  const context = useContext(MetricsContext);
  if (!context) {
    throw new Error("useMetrics not called in MetricsProvider");
  }
  return context;
}