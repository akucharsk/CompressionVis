import { useEffect, useState } from "react";
import './../styles/pages/Admin.css';
import QuestionsUpload from "../components/admin/QuestionsUpload";
import {apiUrl} from "../utils/urls";

const Admin = () => {
    const [videos, setVideos] = useState([]);

    useEffect(() => {
        const fetchVideos = async () => {
            try {
                const response = await fetch(`${apiUrl}/video/all-compressed-videos/`);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);

                const data = await response.json();
                setVideos(data.videos || []);
            } catch (error) {
                console.error("Error while fetching videos:", error);
            }
        };

        fetchVideos();
    }, []);

    const handleDelete = async (videoId) => {
        try {
            const response = await fetch(`${apiUrl}/video/${videoId}/`, {
                method: "DELETE",
            });

            setVideos((prev) => prev.filter((v) => v.id !== videoId));
        } catch (error) {
            console.error(`Error deleting video ${videoId}:`, error);
        }
    };

    return (
        <div className="admin-page">
            <h2>Compressed Videos</h2>

            <div>
                {videos.length === 0 ? (
                    <p>No compressed videos available.</p>
                ) : (
                    videos.map((video) => (
                        <div key={video.id} className="video-row">
                            <span><b>Video ID:</b> {video.id}</span>
                            <span><b>File:</b> {video.filename}</span>
                            <span><b>Original file:</b> {video.original_filename}</span>
                            <span><b>File size:</b> {video.size}</span>
                            <button
                                onClick={() => handleDelete(video.id)}
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
