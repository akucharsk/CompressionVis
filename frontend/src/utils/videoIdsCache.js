import { queryClient } from "./queryClient";

const VIDEO_MAP_KEY = ["videoMap"];

export const addVideoIdToCache = (originalVideoId, compressedVideoId) => {
    queryClient.setQueryData(VIDEO_MAP_KEY, (oldMap = {}) => {
        const currentList = oldMap[originalVideoId] || [];
        if (currentList.includes(compressedVideoId)) return oldMap;

        const newMap = {
            ...oldMap,
            [originalVideoId]: [...currentList, compressedVideoId],
        };

        localStorage.setItem("videoMap", JSON.stringify(newMap));
        return newMap;
    });
};

export const getVideoIdsFromCache = (originalVideoId) => {
    const map = queryClient.getQueryData(VIDEO_MAP_KEY) || {};
    return map[originalVideoId] || [];
};

export const getAllVideoIdsMap = () => {
    return queryClient.getQueryData(VIDEO_MAP_KEY) || {};
};
