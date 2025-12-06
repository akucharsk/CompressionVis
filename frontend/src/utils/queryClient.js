// import { QueryClient } from "@tanstack/react-query";
//
// export const VIDEO_MAP_KEY = ["videoMap"];
//
// const saved = localStorage.getItem("videoMap");
//
// export const queryClient = new QueryClient();
//
// if (saved) {
//     queryClient.setQueryData(VIDEO_MAP_KEY, JSON.parse(saved));
// }
// W pliku gdzie tworzysz queryClient
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            gcTime: Infinity,
            staleTime: Infinity,
            refetchOnWindowFocus: false,
            refetchOnMount: false,
            refetchOnReconnect: false,
        },
    },
});