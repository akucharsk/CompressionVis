import {useSearchParams} from "react-router-dom";
import {useQuery} from "@tanstack/react-query";
import {genericFetch} from "../api/genericFetch";
import {apiUrl} from "../utils/urls";
import { defaultRefetchIntervalPolicy, defaultRetryPolicy } from "../utils/retryUtils";
import {createContext, useContext, useEffect} from "react";
import {useError} from "./ErrorContext";
import {useDisplayMode} from "./DisplayModeContext";

const MacroblocksContext = createContext(null);

export const MacroblocksProvider = ({ children }) => {
    const [ searchParams ] = useSearchParams();
    const videoId = searchParams.get("videoId");
    const frameNumber = parseInt(searchParams.get("frameNumber")) || 0;
    const { showError } = useError();
    const { displayMode } = useDisplayMode();

    const frameMacroBlocksQuery = useQuery({
        queryKey: ["macroblocks", videoId, frameNumber],
        queryFn: async () => await genericFetch(`${apiUrl}/macroblocks/${videoId}/${frameNumber}`),
        refetchInterval: defaultRefetchIntervalPolicy,
        retry: defaultRetryPolicy,
        enabled: !!videoId && displayMode === "frames"
    });

    useEffect(() => {
        const err = frameMacroBlocksQuery.error;
        if (frameMacroBlocksQuery.isError && err) {
            showError(err.message, err.status);
        }
    }, [frameMacroBlocksQuery.isError, frameMacroBlocksQuery.error, showError]);

    const isBlocksReady = frameMacroBlocksQuery.data?.blocks?.length > 0;
    const isBlocksLoading = frameMacroBlocksQuery.isPending || frameMacroBlocksQuery.data?.message === "processing" || !isBlocksReady;

    return (
        <MacroblocksContext.Provider value={{ frameMacroBlocksQuery, isBlocksLoading }}>
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