import { useEffect, useRef, useState } from "react";
import { apiUrl } from "../../utils/urls";
import { useVideoPlaying } from "../../context/VideoPlayingContext";
import { useFrames } from "../../context/FramesContext";
import { useError } from "../../context/ErrorContext";
import { handleApiError } from "../../utils/errorHandler";

const VideoPlayerForAnalysis = ({ videoId }) => {
    const videoRef = useRef();
    const urlRef = useRef();

    const { isVideoPlaying, setIsVideoPlaying } = useVideoPlaying();
    const { setSelectedIdx, frames } = useFrames();
    const { showError } = useError();
    
    const [isLoading, setIsLoading] = useState(false);
    const [videoUrl, setVideoUrl] = useState(null);

    useEffect(() => {
        if (!videoUrl) {
            const controller = new AbortController();

            const fetchVideo = async () => {
                try {
                    if (urlRef.current) {
                        URL.revokeObjectURL(urlRef.current);
                    }

                    const response = await fetch(`${apiUrl}/video/${videoId}/`, {
                        headers: { Range: "bytes=0-"},
                        signal: controller.signal
                    })

                    await handleApiError(response);

                    const blob = await response.blob();
                    const url = URL.createObjectURL(blob);
                    urlRef.current = url;
                    setVideoUrl(url);
                } catch (error) {
                    if (error.name === "AbortError") return;
                    showError(error.message, error.statusCode);
                } finally {
                    setIsLoading(false);
                }
            };           
            setIsLoading(true);
            
            fetchVideo();

            return () => {
                controller.abort();
                if (urlRef.current) {
                    URL.revokeObjectURL(urlRef.current);
                    urlRef.current = null;
                }
            }
        }
    }, [videoId, showError]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        if (isVideoPlaying) video.play().catch(() => {});
        else video.pause();
    }, [isVideoPlaying]);

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
                    onEnded={() => setIsVideoPlaying(false)}
                    className="compressed-video"
                />
            )}
        </div>
    );
}

export default VideoPlayerForAnalysis;