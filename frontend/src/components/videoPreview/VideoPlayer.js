import React, { useEffect, useRef, useState } from "react";
import "../../styles/components/video/VideoPlayer.css";
import {useSettings} from "../../context/SettingsContext";

const VideoPlayer = () => {
    const videoRef = useRef(null);
    const [videoURL, setVideoURL] = useState(null);
    const { parameters } = useSettings();

    useEffect(() => {
        const fetchVideo = async () => {
            try {
                const response = await fetch(`${parameters.videoLink}`, {
                    headers: {
                        Range: "bytes=0-",
                    },
                });

                if (!response.ok) {
                    throw new Error("Nie udało się pobrać filmu");
                }

                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                setVideoURL(url);
            } catch (error) {
                console.error("Błąd podczas pobierania filmu:", error);
            }
        };
        if(!parameters.videoLink) {
            return;
        }

        fetchVideo()

        return () => {
            if (videoURL) {
                URL.revokeObjectURL(videoURL);
            }
        };
    }, [parameters.videoLink]);

    return (
        <div className="video-container">
            {videoURL ? (
                <video
                    ref={videoRef}
                    src={videoURL}
                    controls
                />
            ) : (
                <p>Ładowanie filmu...</p>
            )}
        </div>
    );
};

export default VideoPlayer;
