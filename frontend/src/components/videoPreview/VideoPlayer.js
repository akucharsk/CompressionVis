import React from "react";
import "../../styles/components/video/VideoPlayer.css";
import {useSettings} from "../../context/SettingsContext";

const VideoPlayer = () => {
    const { parameters } = useSettings();

    return (
        <div className="video-container">
            {parameters.videoLink ? (
                <video
                    src={parameters.videoLink}
                    controls
                />
            ) : (
                <p>Preview loading...</p>
            )}
        </div>
    );
};

export default VideoPlayer;