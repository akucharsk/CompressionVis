import './../styles/pages/Admin.css';
import QuestionsUpload from "../components/admin/QuestionsUpload";
import {apiUrl} from "../utils/urls";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { defaultRetryPolicy } from "../utils/retryUtils";
import Spinner from "../components/Spinner";
import { useError } from "../context/ErrorContext";
import { fetchWithCredentials } from "../api/genericFetch";

const Admin = () => {
    const queryClient = useQueryClient();
    const { showError } = useError();
    
    const { data, isPending, error } = useQuery({
        queryKey: ["compressed-videos"],
        queryFn: async () => await fetchWithCredentials(`${apiUrl}/video/all-compressed-videos/`),
        retry: defaultRetryPolicy,
    });

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

    return (
        <div className="admin-page">
            <h2>Compressed Videos</h2>

            <div>
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

            <hr />

            <QuestionsUpload />
        </div>
    );
};

export default Admin;
