import React, { useEffect, useRef, useState } from "react";
import "../../styles/components/video/VideoPlayer.css";
import {useSettings} from "../../context/SettingsContext";
import {useError} from "../../context/ErrorContext";
import {handleApiError} from "../../utils/errorHandler";

const VideoPlayer = () => {
    const videoRef = useRef(null);
    const urlRef = useRef(null);
    const [videoURL, setVideoURL] = useState(null);
    const { parameters } = useSettings();
    const { showError } = useError();

    useEffect(() => {
        if (!parameters.videoLink) return;

        const controller = new AbortController();

        const fetchVideo = async () => {
            try {
                if (urlRef.current) {
                    URL.revokeObjectURL(urlRef.current);
                }

                const response = await fetch(parameters.videoLink, {
                    headers: { Range: "bytes=0-" },
                    signal: controller.signal,
                });

                await handleApiError(response);

                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                urlRef.current = url;
                setVideoURL(url);
            } catch (error) {
                if (error.name === "AbortError") return;
                showError(error.message, error.statusCode);
            }
        };

        fetchVideo();

        return () => {
            controller.abort();
            if (urlRef.current) {
                URL.revokeObjectURL(urlRef.current);
                urlRef.current = null;
            }
        };
    }, [parameters.videoLink, showError]);

    return (
        <div className="video-container">
            {videoURL ? (
                <video
                    ref={videoRef}
                    src={videoURL}
                    controls
                />
            ) : (
                <p>Preview loading...</p>
            )}
        </div>
    );
};

export default VideoPlayer;