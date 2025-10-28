import { useState, useEffect, useRef } from "react";
import { useDisplayMode } from "../context/DisplayModeContext";
import { useSearchParams } from "react-router-dom";
import { useError } from "../context/ErrorContext";
import { fetchImage } from "../api/fetchImage";
import { apiUrl } from "../utils/urls";
import { handleApiError } from "../utils/errorHandler";
import { useFrames } from "../context/FramesContext";
import { MAX_RETRIES } from "../utils/constants";

const ImageVideoBlock = () => {
    const { displayMode, setDisplayMode } = useDisplayMode();
    const { frames, selectedIdx, setSelectedIdx } = useFrames();
    const [ params ] = useSearchParams();
    const { showError } = useError();

    const [imageUrl, setImageUrl] = useState(null);
    const [videoUrl, setVideoUrl] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const urlVideoRef = useRef(null);
    const urlImageRef = useRef(null);
    const frameNumberRef = useRef(0);
    const videoRef = useRef(null);

    const videoId = parseInt(params.get("videoId"));

    useEffect = (() => {
        if (displayMode === "frame") {
            if (!selectedIdx === frameNumberRef) {
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
                    frameNumberRef.current = 0;
                }                
            }
        }
    }, [displayMode, selectedIdx])

    useEffect = (() => {
        if (!videoUrl) {
            const controller = new AbortController();

            const fetchVideo = async () => {
                try {
                    if (urlVideoRef.current) {
                        URL.revokeObjectURL(urlVideoRef.current);
                    }

                    const response = await fetch(`${apiUrl}/video/${videoId}/`, {
                        headers: { Range: "bytes=0-" },
                        signal: controller
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

    return (
        <div className="left-section">
            {isLoading === false && displayMode === "frames" ? (
                <img 
                    src={imageUrl}
                    alt={`Frame ${currentFrameIdx !== null ? currentFrameIdx : selectedIdx} (${frames[selectedIdx].type})`}
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