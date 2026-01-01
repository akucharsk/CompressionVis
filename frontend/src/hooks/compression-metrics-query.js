import { useQueries, useQuery } from "@tanstack/react-query"
import { genericFetch } from "../api/genericFetch"
import { apiUrl } from "../utils/urls"

const CompressionMetricsQueryFn = async (compressionId) => {
    const data = await genericFetch(`${apiUrl}/charts/metrics-data/${compressionId}/`);
    return data;
}

export const useCompressionMetricsQueries = (compressionIds) => {
    return useQueries({
        queries: compressionIds.map(id => ({
            queryKey: ["metricsForCharts", id],
            queryFn: () => CompressionMetricsQueryFn(id),
            enabled: !!id
        }))
    })
}