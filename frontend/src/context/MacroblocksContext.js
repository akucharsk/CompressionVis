import {useSearchParams} from "react-router-dom";
import {useMutation, useQuery} from "@tanstack/react-query";
import {genericFetch} from "../api/genericFetch";
import {apiUrl} from "../utils/urls";
import { defaultRefetchIntervalPolicy, defaultRetryPolicy } from "../utils/retryUtils";
import {createContext, useContext, useEffect} from "react";
import {useError} from "./ErrorContext";

const MacroblocksContext = createContext(null);

export const MacroblocksProvider = ({ children }) => {
    const [ searchParams ] = useSearchParams();
    const videoId = searchParams.get("videoId");
    const frameNumber = parseInt(searchParams.get("frameNumber")) || 0;
    const { showError } = useError();

    const triggerMacroblocksExtraction = useQuery({
        queryKey: ["macroblocks-extraction", videoId],
        queryFn: async () => {
            return await genericFetch(`${apiUrl}/macroblocks/${videoId}/`, { method: "POST" });
        },
        enabled: !!videoId,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchInterval: false,
        retry: false,
        staleTime: Infinity,
    });

    const frameMacroBlocksQuery = useQuery({
        queryKey: ["macroblocks", videoId, frameNumber],
        queryFn: async () => await genericFetch(`${apiUrl}/macroblocks/grid/${videoId}/${frameNumber}`),
        refetchInterval: defaultRefetchIntervalPolicy,
        retry: defaultRetryPolicy,
        enabled: !!videoId && triggerMacroblocksExtraction.isSuccess
    });
    useEffect(() => {
        if (frameMacroBlocksQuery.isError) {
            showError(frameMacroBlocksQuery.error.message, frameMacroBlocksQuery.error.status);
        }
    }, [frameMacroBlocksQuery.isError]);

    const isPending = frameMacroBlocksQuery.isPending || frameMacroBlocksQuery.data?.message === "processing";
    return (
        <MacroblocksContext.Provider value={{ frameMacroBlocksQuery, triggerMacroblocksExtraction, isPending }}>
            {children}
        </MacroblocksContext.Provider>
    )
}

export const useMacroblocks = () => {
    const context = useContext(MacroblocksContext);
    if (!context) {
        throw new Error("useMacroblocks must be used inside MacroblocksProvider");
    }
    return context;
}