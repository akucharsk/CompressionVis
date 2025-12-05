import { useQuery } from "@tanstack/react-query";
import React, { createContext, useCallback, useContext } from "react";
import {useLocation, useSearchParams} from "react-router-dom";
import { apiUrl } from "../utils/urls";
import { DEFAULT_RETRY_TIMEOUT_MS } from "../utils/constants";
import { genericFetch } from "../api/genericFetch";
import { defaultRefetchIntervalPolicy, defaultRetryPolicy } from "../utils/retryUtils";

const FramesContext = createContext();

export const useFrames = () => useContext(FramesContext);

export const FramesProvider = ({ children }) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const location = useLocation();
    const isExcludedPath = location.pathname === "/differences";

    const videoId = searchParams.get("videoId");
    const selectedIdx = parseInt(searchParams.get("frameNumber")) || 0;
    const setSelectedIdx = (newValue) => {
        if (typeof newValue === "number") {
            setSearchParams(prev => {
                prev.set("frameNumber", newValue);
                return prev;
            }, { replace: true });
        } else if (typeof newValue === "function") {
            setSearchParams(prev => {
                prev.set("frameNumber", newValue(selectedIdx));
                return prev;
            }, { replace: true });
        } else {
            throw new Error("Invalid type passed to setSelectedIdx. Expected number or function, got " + typeof newValue);
        }
    }

    const refetchInterval = useCallback((query) => {
        const defaultRetry = defaultRefetchIntervalPolicy(query);
        if (defaultRetry > 0) {
            return defaultRetry;
        }
        const data = query?.state?.data;
        if (data?.frames?.length < data?.total) {
            return DEFAULT_RETRY_TIMEOUT_MS;
        }
        return false;
    }, []);

    const framesQuery = useQuery({
        queryKey: [ "frames", videoId ],
        queryFn: async () => genericFetch(`${apiUrl}/video/frames/${videoId}`),
        refetchInterval,
        retry: defaultRetryPolicy,
        enabled: !!videoId && !isExcludedPath
    });

    framesQuery.isPending = framesQuery.isPending || framesQuery.data?.message === "processing";

    const frames = framesQuery.data?.frames || [];
    const frameSizes = frames.map(frame => frame.pkt_size);
    const min = Math.min.apply(Array, frameSizes);
    const max = Math.max.apply(Array, frameSizes);

    const sizeRange = { min, max };

    return (
        <FramesContext.Provider value={{ selectedIdx, setSelectedIdx, frames, framesQuery, sizeRange }}>
            { children }
        </FramesContext.Provider>
    );
};
