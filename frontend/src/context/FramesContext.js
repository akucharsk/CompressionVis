import { useQuery } from "@tanstack/react-query";
import React, { createContext, useCallback, useContext, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { apiUrl } from "../utils/urls";
import { DEFAULT_RETRY_TIMEOUT_MS } from "../utils/constants";
import { genericFetch } from "../api/genericFetch";
import { defaultRefetchIntervalPolicy, defaultRetryPolicy } from "../utils/retryUtils";

const FramesContext = createContext();

export const useFrames = () => useContext(FramesContext);

export const FramesProvider = ({ children }) => {
    const [searchParams, setSearchParams] = useSearchParams();

    const videoId = searchParams.get("videoId");
    const selectedIdx = parseInt(searchParams.get("frameNumber")) || 0;
    const setSelectedIdx = useCallback((newValue) => {
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
    }, [setSearchParams, selectedIdx]);

    const sceneThreshold = parseFloat(searchParams.get("sceneThreshold") ?? 0.4);
    const setSceneThreshold = useCallback((newValue) => {
        setSearchParams(prev => {
            prev.set("sceneThreshold", newValue);
            return prev;
        }, { replace: true });
    }, [setSearchParams]);

    useEffect(() => {
        const min = 0;
        const max = 1;
        const percent = ((sceneThreshold - min) / (max - min)) * 100;
        document.documentElement.style.setProperty("--scene-percent", `${percent}%`);
    }, [sceneThreshold]);

    const refetchInterval = useCallback((query) => {
        const defaultRetry = defaultRefetchIntervalPolicy(query);
        console.log({ defaultRetry, retry: defaultRetry > 0, queryStateData: query?.state?.data });
        if (defaultRetry > 0) {
            return defaultRetry;
        }
        const data = query?.state?.data;
        console.log({ data });
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
        enabled: !!videoId
    });

    framesQuery.isPending = framesQuery.isPending || framesQuery.data?.message === "processing";

    const frames = useMemo(() => framesQuery.data?.frames || [], [framesQuery.data?.frames]);
    const frameSizes = useMemo(() => frames.map(frame => frame.pkt_size), [frames]);
    const min = Math.min.apply(Array, frameSizes);
    const max = Math.max.apply(Array, frameSizes);

    const scenePositions = useMemo(() => {
        return frames
            .map((frame, idx) => ({ frame, idx }))
            .filter(({ frame, idx }) => idx === 0 || frame.scene_score >= sceneThreshold)
            .map(({ idx }) => idx);
    }, [frames, sceneThreshold]);

    const sizeRange = { min, max };

    const contextValue = {
        selectedIdx,
        setSelectedIdx,
        frames,
        framesQuery,
        sizeRange,
        sceneThreshold,
        setSceneThreshold,
        scenePositions,
    };

    return (
        <FramesContext.Provider value={contextValue}>
            { children }
        </FramesContext.Provider>
    );
};
