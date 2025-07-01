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
    const [errorMessage, setErrorMessage] = useState(null);
    const [errorCode, setErrorCode] = useState(null);

    useEffect(() => {
        sessionStorage.removeItem('frames');
    }, []);

    const handleCompress = async (retries) => {
        setIsLoading(true);
        setErrorMessage(null);
        const resp = await fetch(`${apiUrl}/video/compress/`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                bandwidth: parameters.bandwidth,
                resolution: parameters.resolution,
                crf: parseInt(parameters.crf),
                framerate: parseInt(parameters.framerate),
                videoId: parameters.videoId,
                gop_size: parseInt(parameters.pattern) || 1,
            }),
        })

        if (resp.status === STATUS.HTTP_102_PROCESSING) {
            if (retries === 0) {
                setErrorMessage("Failed to acquire compressed video ID. Please try again later!");
                return;
            }
            await new Promise(resolve => setTimeout(resolve, DEFAULT_RETRY_TIMEOUT_MS))
            handleCompress(retries - 1).then(() => {
            });
            return;
        } else if (!resp.ok) {
            const data = await resp.json();
            setErrorCode(resp.status);
            setErrorMessage(data.message || "An unknown error occurred");
            setIsLoading(false);
            return;
        }
        setIsLoading(false);
        const data = await resp.json();
        const videoId = data.videoId;
        if (!videoId){
            setErrorMessage("Invalid data received" + JSON.stringify(data));
            setErrorCode(STATUS.HTTP_500_INTERNAL_SERVER_ERROR);
            setIsLoading(false);
            return;
        }
        navigate(`/compress?videoId=${videoId}`);
    };

    return (
        <div className="container">
            {isLoading && (
                <div className="loading-overlay">
                    <div className="spinner"></div>
                </div>
            )}
            {errorMessage && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Compression Failed</h3>
                        <p>Error {errorCode}</p>
                        <p>{errorMessage}</p>
                        <button onClick={() => setErrorMessage(null)}>Close</button>
                    </div>
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