import { queryClient } from "./queryClient";

const VIDEO_MAP_KEY = ["videoMap"];
const STORAGE_KEY = "videoMap";
const EXPIRY_KEY = "videoMap_expiry";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function loadPersistentCache() {
    const expiry = Number(localStorage.getItem(EXPIRY_KEY) || 0);
    const now = Date.now();

    if (expiry && now > expiry) {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(EXPIRY_KEY);
        queryClient.setQueryData(VIDEO_MAP_KEY, {});
        return {};
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
        queryClient.setQueryData(VIDEO_MAP_KEY, {});
        return {};
    }

    const data = JSON.parse(raw);
    queryClient.setQueryData(VIDEO_MAP_KEY, data);
    return data;
}

loadPersistentCache();

function saveToLocalStorage(map) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    localStorage.setItem(EXPIRY_KEY, (Date.now() + ONE_DAY_MS).toString());
}

export const addVideoIdToCache = (originalId, compressedId) => {
    queryClient.setQueryData(VIDEO_MAP_KEY, (old = {}) => {
        const list = old[originalId] || [];

        if (list.includes(compressedId)) {
            saveToLocalStorage(old);
            return old;
        }

        const updated = {
            ...old,
            [originalId]: [...list, compressedId],
        };

        saveToLocalStorage(updated);
        return updated;
    });
};

export const removeVideoIdFromCache = (originalId, compressedId) => {
    queryClient.setQueryData(VIDEO_MAP_KEY, (old = {}) => {
        const list = old[originalId] || [];
        if (!list.includes(compressedId)) return old;

        const newList = list.filter(id => id !== compressedId);
        const updated = { ...old };

        if (newList.length === 0) {
            delete updated[originalId];
        } else {
            updated[originalId] = newList;
        }

        saveToLocalStorage(updated);
        return updated;
    });
};

export const getVideoIdsFromCache = (originalId) => {
    return queryClient.getQueryData(VIDEO_MAP_KEY)?.[originalId] || [];
};

export const getAllVideoIdsMap = () => {
    return queryClient.getQueryData(VIDEO_MAP_KEY) || {};
};
