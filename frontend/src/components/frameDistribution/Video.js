import { useEffect, useRef, useState } from "react";
import { apiUrl } from "../../utils/urls";
import { useVideoPlaying } from "../../context/VideoPlayingContext";
import { useFrames } from "../../context/FramesContext";
import { useSettings } from "../../context/SettingsContext";

const VideoPlayerForAnalysis = ({ videoId, videoUrl, setVideoUrl }) => {
    const { parameters } = useSettings();

    const urlRef = useRef();
    const videoRef = useRef();

    const { isVideoPlaying, setIsVideoPlaying } = useVideoPlaying();
    const { setSelectedIdx, frames } = useFrames();
    
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!parameters.videoLink) return;
        
        const controller = new AbortController();

        const fetchVideo = () => {
            try {
                if (urlRef.current) {
                    URL.revokeObjectURL(urlRef.current);
                }

                const response = await fetch(parameters

                )
            }
            fetch()
            .catch()
            .then
        }
    }, [])

    useEffect(() => {
        if (!videoUrl) {
            setIsLoading(true);
            fetch(`${apiUrl}/video/${videoId}/`)
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
                    // controls
                />
            )}
        </div>
    );
}

export default VideoPlayerForAnalysis;