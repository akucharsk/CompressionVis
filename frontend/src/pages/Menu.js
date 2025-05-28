import React, {useEffect, useState} from 'react';
import { useNavigate } from 'react-router-dom';
import './../styles/App.css';
import { useSettings } from "../context/SettingsContext";
import VideoPlayer from "../components/videoPreview/VideoPlayer";
import VideoSelect from "../components/videoPreview/VideoSelect";
import OptionsSection from "../components/videoPreview/OptionsSelection";
import {apiUrl} from "../utils/urls";

function Menu() {
    const navigate = useNavigate();
    const { parameters } = useSettings();
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        sessionStorage.removeItem('frames');
    }, []);

    const maxRetries = 10;

    const handleCompress = (retries) => {
        setIsLoading(true);
        fetch(`${apiUrl}/video/compress/`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                bandwidth: parameters.bandwidth,
                resolution: parameters.resolution,
                crf: parseInt(parameters.crf),
                framerate: 30,
                fileName: parameters.videoName,
            })
        })
            .then((resp) => resp.json())
            .then((data) => {
                const compressedFilename = data["compressedFilename"];
                const isCompressed = data["isCompressed"];
                if (!isCompressed) {
                    throw new Error();
                }
                return compressedFilename;
            })
            .then((compressedFilename) => {
                navigate(`/compress?filename=${compressedFilename}`);
            })
            .catch((_err) => {
                if (retries === 0) {
                    alert(`Failed to acquire compressed video link. Try again later!`);
                    return;
                }
                return new Promise((resolve) => setTimeout(resolve, 2000))
                    .then(() => handleCompress(retries - 1));
            })
            .finally(() => setIsLoading(false));
    };

    return (
        <div className="container">
            {isLoading && (
                <div className="loading-overlay">
                    <div className="spinner"></div>
                </div>
            )}
            <div className="video-section">
                <h3>Video Preview</h3>
                <VideoPlayer fileName={parameters.videoLink} />
                <h3>Video Source</h3>
                <VideoSelect />
            </div>
            <OptionsSection handleCompress={() => handleCompress(maxRetries)} />
        </div>
    );
}

export default Menu;