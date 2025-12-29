import { useQuery } from "@tanstack/react-query";
import { defaultRefetchIntervalPolicy } from "../utils/retryUtils";
import { apiUrl } from "../utils/urls";
import { genericFetch } from "../api/genericFetch";

    
const chartsOptionsStatusFn = async (compressionId) => {
    const data = await genericFetch(`${apiUrl}/metrics-status/${compressionId}`);
    return data;
}
    
export const useChartsOptionsFieldQuery = (compressionId, isActive) => {
    return useQuery({
        queryKey: ["chartsOptionsStatus", compressionId],
        queryFn: () => chartsOptionsStatusFn(compressionId),
        refetchInterval: defaultRefetchIntervalPolicy,
        enabled: !!compressionId && isActive
    })
}
