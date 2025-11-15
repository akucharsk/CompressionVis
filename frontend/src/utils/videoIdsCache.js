import { queryClient } from "./queryClient";

const VIDEO_MAP_KEY = ["videoMap"];
const STORAGE_KEY = "videoMap";
const EXPIRY_KEY = "videoMap_expiry";

const TTL_MS = 7 * 24 * 60 * 60 * 1000;

function loadCacheWithExpiry() {
    const expiry = parseInt(localStorage.getItem(EXPIRY_KEY) || "0", 10);
    const now = Date.now();

    if (expiry && now > expiry) {
        // wygasło — czyścimy
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(EXPIRY_KEY);
        queryClient.setQueryData(VIDEO_MAP_KEY, {});
        return {};
    }

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
        queryClient.setQueryData(VIDEO_MAP_KEY, {});
        return {};
    }

    const parsed = JSON.parse(stored);
    queryClient.setQueryData(VIDEO_MAP_KEY, parsed);
    return parsed;
}

loadCacheWithExpiry();

export const addVideoIdToCache = (originalVideoId, compressedVideoId) => {
    queryClient.setQueryData(VIDEO_MAP_KEY, (oldMap = {}) => {
        const currentList = oldMap[originalVideoId] || [];

        if (currentList.includes(compressedVideoId)) {
            // nic nie zmieniamy, tylko odświeżamy TTL
            localStorage.setItem(EXPIRY_KEY, (Date.now() + TTL_MS).toString());
            return oldMap;
        }

        const newMap = {
            ...oldMap,
            [originalVideoId]: [...currentList, compressedVideoId],
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(newMap));
        localStorage.setItem(EXPIRY_KEY, (Date.now() + TTL_MS).toString());

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

export const removeVideoIdFromCache = (originalVideoId, compressedVideoId) => {
    queryClient.setQueryData(VIDEO_MAP_KEY, (oldMap = {}) => {
        const currentList = oldMap[originalVideoId] || [];

        if (!currentList.includes(compressedVideoId)) {
            return oldMap;
        }

        const newList = currentList.filter(id => id !== compressedVideoId);

        let newMap;

        if (newList.length === 0) {
            newMap = { ...oldMap };
            delete newMap[originalVideoId];
        } else {
            newMap = {
                ...oldMap,
                [originalVideoId]: newList,
            };
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(newMap));

        localStorage.setItem(EXPIRY_KEY, (Date.now() + TTL_MS).toString());

        return newMap;
    });
};

