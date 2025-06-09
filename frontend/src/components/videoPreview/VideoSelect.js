import React, { useEffect, useRef, useState } from "react";
import {useSettings} from "../../context/SettingsContext";
import FileDropZone from "./FileDropZone";
import "../../styles/components/video/VideoSelect.css";

const VideoSelect = ({ }) => {
    const [videoSources, setVideoSources] = useState([]);
    const { parameters, setParameters } = useSettings();

    const selectVideo = (url) => {
        setParameters({
            ...parameters,
            videoLink: url,
            videoName: url.split('/').pop()
        });
    };

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

    const handleFileChange = (file) => {
        const url = URL.createObjectURL(file);
        if (file.type.startsWith("video/")) {
            setParameters({videoLink: url});
        } else {
            alert("Unsupported file format");
        }
    };
    return (
        <div className="video-select">
            {videoSources.map((video, index) => {
                const isActive = parameters.videoLink === video.url;

                return (
                    <div
                        key={index}
                        className={`video-thumbnail ${isActive ? "active" : ""}`}
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
                );
            })}
            <FileDropZone onFileSelected={handleFileChange}/>
        </div>
    );
};

export default VideoSelect;
