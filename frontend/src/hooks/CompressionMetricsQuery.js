import { useQueries, useQuery } from "@tanstack/react-query"
import { genericFetch } from "../api/genericFetch"
import { apiUrl } from "../utils/urls"

const CompressionMetricsQueryFn = async (compressionId) => {
    const data = await genericFetch(`${apiUrl}/metrics/frames/${compressionId}/all/`);
    return data;
}

//fdsfad const CompressionSizeQueryFn = async (compressionId) => {
//     const data = await genericFetch(`${apiUrl}/metrics/frames/${compressionId}/all/`);
//     return data;
// }

export const CompressionMetricsQueries = (compressionIds) => {
    return useQueries({
        queries: compressionIds.map(id => ({
            queryKey: ["metricsForCharts", id],
            queryFn: () => CompressionMetricsQueryFn(id),
            enabled: !!id
        }))
    })
}