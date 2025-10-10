import { useEffect, useRef, useState } from "react";
import { apiUrl } from "../../utils/urls";

const Video = ({ videoId, isPlaying, setIsPlaying, videoUrl, setVideoUrl, setSelectedIdx, frames }) => {
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

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        if (!frames || frames.length === 0) return;

        const handleTimeUpdate = () => {
            const currentTime = video.currentTime;
            let closestIdx = 0;
            for (let i = 0; i < frames.length; i++) {
                const nextTime = frames[i + 1]?.pts_time ?? Infinity;
                if (currentTime >= frames[i].pts_time && currentTime < nextTime) {
                    closestIdx = i;
                    break;
                }
            }
            setSelectedIdx(prev => (prev !== closestIdx ? closestIdx : prev));
        };

        video.addEventListener("timeupdate", handleTimeUpdate);
        return () => video.removeEventListener("timeupdate", handleTimeUpdate);
        }, [frames, setSelectedIdx, videoUrl]);

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
                    // controls
                />
            )}
        </div>
    );
}

export default Video;