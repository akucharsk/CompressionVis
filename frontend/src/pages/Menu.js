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
import {useError} from "../context/ErrorContext";
import {handleApiError} from "../utils/errorHandler";

function Menu() {
    const navigate = useNavigate();
    const { parameters, setParameters } = useSettings();
    const [isLoading, setIsLoading] = useState(false);
    const {showError} = useError();

    useEffect(() => {
        sessionStorage.removeItem('frames');
    }, []);

    const handleCompress = async (retries) => {
        setIsLoading(true);

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
                ...(parameters.qualityMode === "crf" && {crf: parseInt(parameters.crf)}),
                ...(parameters.qualityMode === "bandwidth" && {bandwidth: parameters.bandwidth}),
            };
        }

        try {
            const resp = await fetch(endpoint, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(requestBody),
            });

            if (resp.status === STATUS.HTTP_202_ACCEPTED) {
                if (retries === 0) {
                    showError("Failed to acquire compressed video ID. Please try again later!");
                    return;
                }
                await new Promise(resolve => setTimeout(resolve, DEFAULT_RETRY_TIMEOUT_MS));
                return handleCompress(retries - 1);
            }

            await handleApiError(resp);

            const data = await resp.json();
            const videoId = data.videoId;

            if (!videoId) {
                showError("Invalid data received. " + data?.message);
                return;
            }

            if (data.resultingSize) {
                setParameters((prev) => ({
                    ...prev,
                    resultingSize: data.resultingSize,
                }));
            }

            navigate(`/compress?videoId=${videoId}`);
        } catch (error) {
            showError(error.message, error.statusCode);
        } finally {
            setIsLoading(false);
        }
    }

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