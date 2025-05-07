import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './../styles/App.css';
import { useSettings } from "../context/SettingsContext";

function Menu() {
    const videoRef = useRef(null);
    const [videoFile, setVideoFile] = useState(null);
    const [videoSources, setVideoSources] = useState([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    const navigate = useNavigate();
    const [bandwidth, setBandwidth] = useState("1");
    const [resolution, setResolution] = useState("1");
    const [pattern, setPattern] = useState("1");
    const [crf, setCrf] = useState("20");
    const [videoName, setVideoName] = useState("");
    const { parameters, setParameters } = useSettings();

    useEffect(() => {
        fetch("http://127.0.0.1:8000/video/example")
            .then((res) => res.json())
            .then((data) => {
                const formatted = data.map((item) => ({
                    name: item.name,
                    thumbnail: `http://127.0.0.1:8000/video/thumbnail/${item.thumbnail}`,
                    url: `http://127.0.0.1:8000/video/${item.name}`
                }));
                setVideoSources(formatted);
            })
            .catch((error) => console.error("Failed to fetch video sources:", error));
    }, []);

    useEffect(() => {
        if (parameters.videoLink) {
            console.log(parameters.videoLink, parameters.videoName)
            navigate('/compress');
        }
    }, [parameters, navigate]);

    const handleCompress = () => {
        if (!videoFile) {
            alert("Please select a video first");
            return;
        }
        fetch("http://localhost:8000/video/compress/", {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                bandwidth: bandwidth,
                resolution: resolution,
                crf: parseInt(crf),
                framerate: 30,
                fileName: videoName
            })
        })
            .then((resp) => resp.json())
            .then((data) => {
                console.log(data['compressedUrl'].split('/'), data)
                const urlSplit = data['compressedUrl'].split('/');
                const filename = urlSplit[urlSplit.length - 2];
                setParameters({ videoLink: videoFile, videoName: filename, bandwidth, resolution, pattern });
            })
            .catch((error) => console.log(error))
    };

    const handleFileChange = (file) => {
        const url = URL.createObjectURL(file);
        if (file.type.startsWith("video/")) {
            setVideoFile(url);
        } else {
            alert("Unsupported file format");
        }
    };

    const handlePlay = () => {
        if (videoRef.current) {
            const videoElement = videoRef.current;
            if (isPlaying) {
                videoElement.pause();
                setIsPlaying(false);
            } else {
                videoElement.play()
                    .then(() => setIsPlaying(true))
                    .catch((error) => {
                        console.error("Playback failed:", error);
                        alert("Error playing video. Please check the video file.");
                    });
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

    const selectVideo = (url) => {
        setVideoFile(url);
        setVideoName(url.split('/').pop());
        setIsPlaying(false);
        setCurrentTime(0);
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
                        <div
                            key={index}
                            className="video-thumbnail"
                            onClick={() => selectVideo(video.url)}
                        >
                            <img
                                src={video.thumbnail}
                                alt={video.name}
                                width={120}
                                height={70}
                            />
                            <span>{video.name}</span>
                        </div>
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
                        <option value="64k">64kB/s</option>
                        <option value="128k">128kB/s</option>
                        <option value="1M">1MB/s</option>
                    </select>
                </div>
                <div className="dropdown">
                    <label>Resolution</label>
                    <select value={resolution} onChange={(e) => setResolution(e.target.value)}>
                        <option value="1920x1080">1920x1080</option>
                        <option value="1280x720">1280x720</option>
                        <option value="400x400">400x400</option>
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
                <div className="dropdown">
                    <label>Constant Rate Factor</label>
                    <select value={crf} onChange={(e) => setCrf(e.target.value)}>
                        <option value="10">10</option>
                        <option value="20">20</option>
                        <option value="35">35</option>
                        <option value="51">51 (max)</option>
                    </select>
                </div>
                <button
                    className="compress-btn"
                    onClick={handleCompress}
                    disabled={!videoFile}
                >
                    COMPRESS
                </button>
            </div>
        </div>
    );
}

export default Menu;
