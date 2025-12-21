import { useQuery } from "@tanstack/react-query";
import { defaultRetryPolicy } from "../utils/retryUtils";
import { genericFetch } from "../api/genericFetch";
import { apiUrl } from "../utils/urls";

export function useCompressedVideos(originalVideoId = null) {
  const search = originalVideoId ? `?original_id=${originalVideoId}` : "";
  return useQuery({
    queryKey: ["compressed-videos", ...(search ? [search] : [])],
    queryFn: async () => await genericFetch(`${apiUrl}/video/all-compressed-videos/${search}`),
    retry: defaultRetryPolicy,
  });
}
