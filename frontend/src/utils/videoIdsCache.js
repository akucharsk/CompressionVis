import { queryClient } from "./queryClient";

const VIDEO_MAP_KEY = ["videoMap"];

export const addVideoIdToCache = (originalVideoId, compressedVideoId) => {
    queryClient.setQueryData(VIDEO_MAP_KEY, (oldMap) => {
        const map = oldMap || {};
        const currentList = map[originalVideoId] || [];

        if (currentList.includes(compressedVideoId)) return map;

        return {
            ...map,
            [originalVideoId]: [...currentList, compressedVideoId],
        };
    });
};

export const getVideoIdsFromCache = (originalVideoId) => {
    const map = queryClient.getQueryData(VIDEO_MAP_KEY) || {};
    return map[originalVideoId] || [];
};

export const getAllVideoIdsMap = () => {
    return queryClient.getQueryData(VIDEO_MAP_KEY) || {};
};
