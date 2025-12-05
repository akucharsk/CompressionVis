import { useQuery } from "@tanstack/react-query";
import { apiUrl } from "../../utils/urls";
import { genericFetch } from "../../api/genericFetch";
import { defaultRefetchIntervalPolicy, defaultRetryPolicy } from "../../utils/retryUtils";

export const useCustomMetrics = (videoId) => {
    const videoMetricsQueryCustom = useQuery({
        queryKey: ["customMetrics", videoId],
        queryFn: async () => await genericFetch(`${apiUrl}/metrics/${videoId}`),
        refetchInterval: defaultRefetchIntervalPolicy,
        retry: defaultRetryPolicy,
        enabled: !!videoId,
    });

    const frameMetricsQueryCustom = useQuery({
        queryKey: ["customMetrics", videoId, "all"],
        queryFn: async () => await genericFetch(`${apiUrl}/metrics/frames/${videoId}/all`),
        refetchInterval: defaultRefetchIntervalPolicy,
        retry: defaultRetryPolicy,
        enabled: !!videoId,
    });

    return { videoMetricsQueryCustom, frameMetricsQueryCustom };
};
