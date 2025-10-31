import { useState, useEffect, useRef } from "react";
import { useDisplayMode } from "../context/DisplayModeContext";
import { useSearchParams } from "react-router-dom";
import { useError } from "../context/ErrorContext";
import { fetchImage } from "../api/fetchImage";
import { apiUrl } from "../utils/urls";
import { handleApiError } from "../utils/errorHandler";
import { useFrames } from "../context/FramesContext";
import { MAX_RETRIES } from "../utils/constants";
import { useVideoPlaying } from "../context/VideoPlayingContext";

const ImageVideoBlock = () => {
    const { displayMode, setDisplayMode } = useDisplayMode();
    const { frames, selectedIdx, setSelectedIdx } = useFrames();
    const [ params ] = useSearchParams();
    const { isVideoPlaying, setIsVideoPlaying } = useVideoPlaying();
    const { showError } = useError();

    const [imageUrl, setImageUrl] = useState(null);
    const [videoUrl, setVideoUrl] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const urlVideoRef = useRef(null);
    const urlImageRef = useRef(null);
    const frameNumberRef = useRef(0);
    const videoRef = useRef(null);
    const isSynchronizedVideo = useRef(false);

    const videoId = parseInt(params.get("videoId"));

    useEffect(() => {

        if (!(selectedIdx === frameNumberRef.current)) {

            const controller = new AbortController();

            const loadImage = async () => {
                if (urlImageRef.current) {
                    URL.revokeObjectURL(urlImageRef.current);
                }

                try {
                    const url = await fetchImage(
                        MAX_RETRIES,
                        `${apiUrl}/frames/${videoId}/${selectedIdx}/`,
                        controller
                    );

                    urlImageRef.current = url;
                    setImageUrl(url);
                    frameNumberRef.current = selectedIdx;
                } catch (error) {
                    if (error.name === "AbortError") return;
                    showError(error.message, error.statusCode);
                } finally {
                    setIsLoading(false);
                }
            };

            loadImage();

            return () => {
                controller.abort();
                urlImageRef.current = null;
            }                
        }
    }, [displayMode, selectedIdx])

    useEffect(() => {
        if (!videoUrl) {
            const controller = new AbortController();

            const fetchVideo = async () => {
                try {
                    if (urlVideoRef.current) {
                        URL.revokeObjectURL(urlVideoRef.current);
                    }

                    const response = await fetch(`${apiUrl}/video/${videoId}/`, {
                        headers: { Range: "bytes=0-" },
                        signal: controller.signal
                    })

                    await handleApiError(response);

                    const blob = await response.blob();
                    const url = URL.createObjectURL(blob);
                    urlVideoRef.current = url;
                    setVideoUrl(url);
                } catch (error) {
                    if (error.name === "AbortError") return;
                    showError(error.message, error.statusCode);
                } finally {
                    setIsLoading(false);
                }
            }
            setIsLoading(true);

            fetchVideo();

            return () => {
                controller.abort();
                if (urlVideoRef.current) {
                    URL.revokeObjectURL(urlVideoRef.current);
                    urlVideoRef.current = null;
                }
            }
        }
    }, [videoId, showError])

    useEffect(() => {
        const video = videoRef.current;
        
        if (!video) return;

        if (!isSynchronizedVideo.current) {
            video.currentTime = frames[selectedIdx].pts_time;
            isSynchronizedVideo.current = true;
        }

        if (isVideoPlaying) {
            video.play().catch(() => {});
        }
        else video.pause();

    }, [selectedIdx, isVideoPlaying])

    useEffect(() => {
        const video = videoRef.current;

        if (!video) {return;}
        if (!isVideoPlaying) {
            video.currentTime=frames[selectedIdx].pts_time;
        }
    
    }, [selectedIdx])

    useEffect(() => {
        const video = videoRef.current;
        if (!video || !frames.length) return;

        let animationFrameId;

        const updateFrame = () => {
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

            if (!video.paused && !video.ended) {
                animationFrameId = requestAnimationFrame(updateFrame);
            }
        };

        if (isVideoPlaying) {
            animationFrameId = requestAnimationFrame(updateFrame);
        }

        return () => cancelAnimationFrame(animationFrameId);
    }, [videoUrl, frames, isVideoPlaying]);


    return (
        <div className="left-section">
            {isLoading === false && displayMode === "frames" ? (
                <img 
                    src={imageUrl}
                    // alt={`Frame ${currentFrameIdx !== null ? currentFrameIdx : selectedIdx} (${frames[selectedIdx].type})`}
                />
            ) : isLoading === false && displayMode === "video" ? (
                <video
                    ref={videoRef}
                    src={videoUrl}
                    onEnded={() => setIsVideoPlaying(false)}
                    className="compressed-video"
                />
            ) : (<div className="spinner"></div>)}
        </div>
    )
}

export default ImageVideoBlock;