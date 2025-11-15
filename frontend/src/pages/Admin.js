import { useEffect, useState } from "react";
import './../styles/pages/Admin.css';

const Admin = () => {
    const [videos, setVideos] = useState([]);

    useEffect(() => {
        const fetchVideos = async () => {
            try {
                const response = await fetch("http://localhost:8000/video/all-compressed-videos/");
                if (!response.ok) throw new Error(`HTTP ${response.status}`);

                const data = await response.json();
                setVideos(data.videos || []);   // ⬅ WAŻNE!
            } catch (error) {
                console.error("Błąd podczas pobierania danych:", error);
            }
        };

        fetchVideos();
    }, []);

    const handleDelete = async (videoId) => {
        try {
            const response = await fetch(`http://localhost:8000/video/delete/${videoId}/`, {
                method: "DELETE",
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            setVideos((prev) => prev.filter((v) => v.id !== videoId));
        } catch (error) {
            console.error(`Błąd przy usuwaniu video ${videoId}:`, error);
        }
    };

    return (
        <div className="admin-page">
            <h2>Compressed Videos</h2>

            <div>
                {videos.length === 0 ? (
                    <p>Brak skompresowanych filmów.</p>
                ) : (
                    videos.map((video) => (
                        <div key={video.id} className="video-row">
                            <span><b>Video ID:</b> {video.id}</span>
                            <span><b>Plik:</b> {video.filename}</span>
                            <span><b>Oryginalny film:</b> {video.original_filename}</span>
                            <span><b>Rozmiar pliku:</b> {video.size}</span>
                            <button
                                onClick={() => handleDelete(video.id)}
                                style={{padding: "4px 10px", cursor: "pointer"}}
                            >
                                Usuń
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Admin;
