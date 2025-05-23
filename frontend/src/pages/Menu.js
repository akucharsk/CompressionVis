import React, {useEffect, useState} from 'react';
import { useNavigate } from 'react-router-dom';
import './../styles/App.css';
import { useSettings } from "../context/SettingsContext";
import VideoPlayer from "../components/videoPreview/VideoPlayer";
import VideoSelect from "../components/videoPreview/VideoSelect";
import OptionsSection from "../components/videoPreview/OptionsSelection";

function Menu() {
    const navigate = useNavigate();
    const { parameters } = useSettings();
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        sessionStorage.removeItem('frames');
    }, []);

    const handleCompress = () => {
        setIsLoading(true);
        fetch("http://localhost:8000/video/compress/", {
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
                console.log(data);
                const urlSplit = data['compressedUrl'].split('/');
                const filename = urlSplit[urlSplit.length - 2];
            })
            .then(() => {
                console.log(parameters.videoLink, parameters.videoName);
                navigate('/compress');
            })
            .catch((error) => console.log(error))
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
            <OptionsSection handleCompress={handleCompress} />
        </div>
    );
}

export default Menu;