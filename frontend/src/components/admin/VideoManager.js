import { fetchWithCredentials } from "../../api/genericFetch";
import { apiUrl } from "../../utils/urls";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useError } from "../../context/ErrorContext";
import Spinner from "../Spinner";
import { useCompressedVideos } from "../../hooks/compressed-videos";

export default function VideoManager() {
  const queryClient = useQueryClient();
  const { showError } = useError();

  const deleteVideoMutation = useMutation({
    mutationFn: async (videoId) => await fetchWithCredentials(`${apiUrl}/video/${videoId}/`, { method: "DELETE" }),
    onSuccess: (data) => {
        const videoId = data.videoId;
        const queryKeys = [
            ["compressed-videos"],
            ["metrics", videoId],
            ["frames", videoId],
            ["macroblocks", videoId],
            ["customMetrics", videoId],
            ["macroblock-history", videoId],
        ];
        queryKeys.forEach(key => queryClient.invalidateQueries({ queryKey: key }));
    },
    onError: (error) => {
        showError(error);
    },
  });

  const { data, isPending, error } = useCompressedVideos();
  
  if (error) showError(error);
  return (
    <div style={{ border: "1px solid var(--border-color)", padding: "1rem", borderRadius: "0.5rem" }}>
        <h2>Compressed Videos</h2>

        <div style={{ maxHeight: "40vh", overflowY: "auto" }}>
            {isPending ? <Spinner /> : data?.videos?.length === 0 ? (
                <p>No compressed videos available.</p>
            ) : (
                data?.videos?.map((video) => (
                    <div key={video.id} className="video-row">
                        <span><b>Video ID:</b> {video.id}</span>
                        <span><b>File:</b> {video.filename}</span>
                        <span><b>Original file:</b> {video.original_filename}</span>
                        <span><b>File size:</b> {video.size}</span>
                        <button
                            onClick={() => deleteVideoMutation.mutate(video.id)}
                            style={{ padding: "4px 10px", cursor: "pointer" }}
                        >
                            Delete
                        </button>
                    </div>
                ))
            )}
        </div>
    </div>
  )
}