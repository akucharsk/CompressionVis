import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './../styles/App.css';
import { useSettings } from "../context/SettingsContext";
import VideoPlayer from "../components/videoPreview/VideoPlayer";
import VideoSelect from "../components/videoPreview/VideoSelect";
import OptionsSection from "../components/videoPreview/OptionsSelection";

function Menu() {
    const navigate = useNavigate();
    const { parameters, setParameters } = useSettings();

    const handleCompress = () => {
        console.log(parameters);
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
                if (!data['compressed']) {
                    setTimeout(handleCompress, 5000);
                    throw Error('Compression in progress');
                }
                const compressed = data['compressedFilename'];
                setParameters(prev => ({
                    ...prev,
                    compressedFilename: compressed,
                }));
            })
            .then(() => {
                console.log(parameters.videoLink, parameters.videoName)
                navigate('/compress');
            })
            .catch((error) => console.log(error))
    };

    return (
        <div className="container">
            <div className="video-section">
                <h3>Video Preview</h3>
                <VideoPlayer fileName={parameters.videoLink}/>
                <h3>Video Source</h3>
                <VideoSelect />
            </div>
            <OptionsSection
                handleCompress={handleCompress}
            />
        </div>
    );
}

export default Menu;

