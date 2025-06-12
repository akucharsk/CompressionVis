import React, {useEffect, useState} from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/pages/Menu.css';
import { useSettings } from "../context/SettingsContext";
import VideoPlayer from "../components/videoPreview/VideoPlayer";
import VideoSelect from "../components/videoPreview/VideoSelect";
import OptionsSection from "../components/videoPreview/OptionsSelection";
import {apiUrl} from "../utils/urls";
import {DEFAULT_RETRY_TIMEOUT_MS, MAX_RETRIES} from "../utils/constants";
import {STATUS} from "../utils/enums/status";

function Menu() {
    const navigate = useNavigate();
    const { parameters } = useSettings();
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        sessionStorage.removeItem('frames');
    }, []);

    const handleCompress = async (retries) => {
        setIsLoading(true);
        try {
            const resp = await fetch(`${apiUrl}/video/compress/`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    bandwidth: parameters.bandwidth,
                    resolution: parameters.resolution,
                    crf: parseInt(parameters.crf),
                    framerate: parseInt(parameters.framerate),
                    videoId: parameters.videoId,
                    gop_size: parseInt(parameters.pattern),
                }),
            })

            if (resp.status === STATUS.HTTP_102_PROCESSING) {
                if (retries === 0) {
                    alert("Failed to acquire compressed video ID. Please try again later!");
                    return;
                }
                await new Promise(resolve => setTimeout(resolve, DEFAULT_RETRY_TIMEOUT_MS))
                handleCompress(retries - 1).then(() => {
                });
                return;
            } else if (!resp.ok) {
                const data = await resp.text();
                throw new Error(`${resp.status}: ${data}`);
            }
            setIsLoading(false);
            const data = await resp.json();
            const videoId = data.videoId;
            if (!videoId)
                throw new Error("Invalid data received" + JSON.stringify(data));
            navigate(`/compress?videoId=${videoId}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container">
            {isLoading && (
                <div className="loading-overlay">
                    <div className="spinner"></div>
                </div>
            )}
            <div className="video-section">
                <h2>Video Preview</h2>
                <VideoPlayer />
                <h2>Video Source</h2>
                <VideoSelect />
            </div>
            <OptionsSection handleCompress={() => handleCompress(MAX_RETRIES)} />
        </div>
    );
}

export default Menu;