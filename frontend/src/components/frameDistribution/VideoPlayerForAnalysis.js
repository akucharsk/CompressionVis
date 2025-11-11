import { useEffect } from "react";
import { apiUrl } from "../../utils/urls";
import { useVideoPlaying } from "../../context/VideoPlayingContext";
import { useFrames } from "../../context/FramesContext";
import { useError } from "../../context/ErrorContext";
import { useFps } from "../../context/FpsContext";

const VideoPlayerForAnalysis = ({ videoId, videoRef }) => {
    const { isVideoPlaying, setIsVideoPlaying } = useVideoPlaying();
    const { selectedIdx, setSelectedIdx, frames, framesQuery } = useFrames();
    const { fps } = useFps();
    const { showError } = useError();
    
    const videoUrl = `${apiUrl}/video/${videoId}`;

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        if (isVideoPlaying) video.play().catch(() => {});
        else video.pause();
    }, [isVideoPlaying]);

    useEffect(() => {
        const video = videoRef.current;

        if (!video) return;
        video.playbackRate = fps / 30;

    }, [fps, videoRef.current]);

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
            {framesQuery.isPending ? (
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