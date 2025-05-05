import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './../styles/App.css';
import {useSettings} from "../context/SettingsContext";

function Menu() {
    const videoRef = useRef(null);
    const [videoFile, setVideoFile] = useState(null);

    const videoSources = [
        { label: "Video 1", url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4" },
        { label: "Video 2", url: "https://example.com/videos/video2.mp4" },
        { label: "Video 3", url: "https://example.com/videos/video3.mp4" },
        { label: "Video 4", url: "https://example.com/videos/video4.mp4" },
    ];
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    const navigate = useNavigate();
    const [bandwidth, setBandwidth] = useState("1");
    const [resolution, setResolution] = useState("1");
    const [pattern, setPattern] = useState("1");
    const { setParameters } = useSettings();

    const handleCompress = () => {
        setParameters({
            video: videoFile,
            bandwidth: bandwidth,
            resolution: resolution,
            pattern: pattern,
        });
        navigate('/compress');
    };

    const handleFileChange = (file) => {
        setVideoFile(URL.createObjectURL(file));
    };

    const handlePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
                setIsPlaying(false);
            } else {
                videoRef.current.play();
                setIsPlaying(true);
            }
        }
    };
    const handleStop = () => {
        if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
            setIsPlaying(false);
        }
    };


    const handleDrop = (e) => {
        e.preventDefault();
        if (e.dataTransfer.files.length > 0) {
            handleFileChange(e.dataTransfer.files[0]);
        }
    };

    return (
        <div className="container">
            <div className="video-section">
                <video
                    ref={videoRef}
                    src={videoFile}
                    controls={false}
                    width="100%"
                    onTimeUpdate={() => setCurrentTime(videoRef.current.currentTime)}
                    onLoadedMetadata={() => setDuration(videoRef.current.duration)}
                />
                <div className="controls">
                    <button onClick={handlePlay} className="play">
                        {isPlaying ? "⏸" : "▶"}
                    </button>

                    <button onClick={handleStop} className="stop">■</button>
                </div>
                <input
                    type="range"
                    className="slider"
                    min="0"
                    max={duration}
                    step="0.1"
                    value={currentTime}
                    onChange={(e) => {
                        const time = parseFloat(e.target.value);
                        setCurrentTime(time);
                        if (videoRef.current) {
                            videoRef.current.currentTime = time;
                        }
                    }}
                />

                <div className="video-select">
                    {videoSources.map((video, index) => (
                        <button key={index} onClick={() => setVideoFile(video.url)}>
                            {video.label}
                        </button>
                    ))}
                </div>

                <div
                    className="drop-zone"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                >
                    <p>Or drag it here</p>
                    <input
                        type="file"
                        accept="video/*"
                        id="fileInput"
                        style={{display: "none"}}
                        onChange={(e) => {
                            if (e.target.files.length > 0) {
                                handleFileChange(e.target.files[0]);
                            }
                        }}
                    />
                    <button onClick={() => document.getElementById('fileInput').click()}>
                        Select from disk
                    </button>
                </div>

            </div>

            <div className="options-section">
                <div className="dropdown">
                    <label>Bandwidth</label>
                    <select value={bandwidth} onChange={(e) => setBandwidth(e.target.value)}>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                    </select>
                </div>
                <div className="dropdown">
                    <label>Resolution</label>
                    <select value={resolution} onChange={(e) => setResolution(e.target.value)}>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                    </select>
                </div>
                <div className="dropdown">
                    <label>I,P,B frame pattern</label>
                    <select value={pattern} onChange={(e) => setPattern(e.target.value)}>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                    </select>
                </div>
                <button className="compress-btn" onClick={handleCompress}>COMPRESS</button>
            </div>
        </div>
    );
}

export default Menu;
