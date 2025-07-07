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
    const { parameters, setParameters } = useSettings();
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    const [errorCode, setErrorCode] = useState(null);

    useEffect(() => {
        sessionStorage.removeItem('frames');
    }, []);

    const handleCompress = async (retries) => {
        setIsLoading(true);
        setErrorMessage(null);

        let endpoint, requestBody;

        if (parameters.mode === "compressedSize") {
            endpoint = `${apiUrl}/video/size-compress/`;
            requestBody = {
                videoId: parameters.videoId,
                targetSize: parseInt(parameters.compressedSize)
            };
        } else {
            endpoint = `${apiUrl}/video/compress/`;
            requestBody = {
                resolution: parameters.resolution,
                videoId: parameters.videoId,
                gop_size: parseInt(parameters.pattern) || 1,
                preset: parameters.preset,
                bf: parameters.bFrames,
                aq_mode: parseInt(parameters.aqMode),
                aq_strength: parseFloat(parameters.aqStrength) || 1.0,
                ...(parameters.qualityMode === "crf" && { crf: parseInt(parameters.crf) }),
                ...(parameters.qualityMode === "bandwidth" && { bandwidth: parameters.bandwidth }),
            };
        }

        const resp = await fetch(endpoint, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(requestBody),
        });

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
            setErrorMessage("Invalid data received. " + data?.message);
            setErrorCode(resp.status);
            setIsLoading(false);
            return;
        }

        if (data.resultingSize) {
            setParameters((prev) => ({
                ...prev,
                resultingSize: data.resultingSize,
            }));
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