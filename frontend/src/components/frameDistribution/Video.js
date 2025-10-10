import { useEffect, useRef, useState } from "react";
import { apiUrl } from "../../utils/urls";

const Video = ({ videoId, isPlaying, setIsPlaying, videoUrl, setVideoUrl }) => {
    const videoRef = useRef(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!videoUrl) {
            setIsLoading(true);
            fetch(`${apiUrl}/compressed_video/${videoId}/`)
                .then(res => res.blob())
                .then(blob => {
                    const url = URL.createObjectURL(blob);
                    setVideoUrl(url);
                })
                .catch(err => console.error("Error while video download", err))
                .finally(() => setIsLoading(false));
        }
    }, [videoUrl, videoId, setVideoUrl]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        if (isPlaying) video.play().catch(() => {});
        else video.pause();
    }, [isPlaying]);


    return (
        <div className="video-player-container">
            {isLoading ? (
                <div className="spinner"></div>
            ) : (
                <video
                    ref={videoRef}
                    src={videoUrl}
                    onEnded={() => setIsPlaying(false)}
                    className="compressed-video"
                    // controls={false}
                    controls
                />
            )}
        </div>
    );
}

export default Video;