import { QueryClient } from "@tanstack/react-query";

export const VIDEO_MAP_KEY = ["videoMap"];

const saved = localStorage.getItem("videoMap");

export const queryClient = new QueryClient();

if (saved) {
    queryClient.setQueryData(VIDEO_MAP_KEY, JSON.parse(saved));
}
