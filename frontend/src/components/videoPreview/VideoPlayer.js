import React, { useEffect, useRef, useState } from "react";
import "../../styles/components/video/VideoPlayer.css";

const VideoPlayer = ({ fileName }) => {
    const videoRef = useRef(null);
    const [videoURL, setVideoURL] = useState(null);

    useEffect(() => {
        const fetchVideo = async () => {
            try {
                console.log(fileName);
                const response = await fetch(`${fileName}`, {
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
        if(fileName == null){
            return;
        }

        fetchVideo()

        return () => {
            if (videoURL) {
                URL.revokeObjectURL(videoURL);
            }
        };
    }, [fileName]);

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
