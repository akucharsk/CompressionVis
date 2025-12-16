import { useCallback } from "react";
import { genericFetch } from "../api/genericFetch";
import { apiUrl } from "../utils/urls";
import { useQuery } from "@tanstack/react-query";
import { defaultRetryPolicy } from "../utils/retryUtils";
import { defaultRefetchIntervalPolicy } from "../utils/retryUtils";
import { useSettings } from "../context/SettingsContext";

export function useOriginalVideos() {
  const { setParameters } = useSettings();
  const queryFn = useCallback(async () => {
    const data = await genericFetch(`${apiUrl}/video/example/`);
    const formattedData = data["videoIds"].map((item) => ({
        id: item.id,
        name: item.title,
        thumbnail: `${apiUrl}/video/thumbnail/${item.id}/`,
        url: `${apiUrl}/video/${item.id}/`
    }));
    const randomVideo = formattedData[Math.floor(Math.random() * formattedData.length)];
    setParameters(prev => ({
        ...prev,
        videoLink: randomVideo.url,
        videoId: randomVideo.id,
        videoName: randomVideo.name
    }));
    return formattedData;
  }, [ setParameters ]);

  return useQuery({
      queryKey: [ "originalVideos" ],
      queryFn,
      retry: defaultRetryPolicy,
      refetchInterval: defaultRefetchIntervalPolicy
  });
}
