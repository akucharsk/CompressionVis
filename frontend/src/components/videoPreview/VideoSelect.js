import React, { useEffect, useState } from "react";
import {useSettings} from "../../context/SettingsContext";
import FileDropZone from "./FileDropZone";
import {apiUrl} from "../../utils/urls";
import "../../styles/components/video/VideoSelect.css";
import {useError} from "../../context/ErrorContext";

const VideoSelect = () => {
    const [videoSources, setVideoSources] = useState([]);
    const { parameters, setParameters } = useSettings();
    const {showError} = useError();

    const selectVideo = (video) => {
        setParameters(prev => ({
            ...prev,
            videoLink: video.url,
            videoId: video.id,
            videoName: video.name,
        }));
    };

    useEffect(() => {
        const controller = new AbortController();
        const fetchExample = async () => {
            let data;
            try {
                const resp = await fetch(`${apiUrl}/video/example/`, { signal: controller.signal });
                data = await resp.json();
            } catch (error) {
                if (error.name === "AbortError") return;
                showError(error.message, error.statusCode);
            }
            
            try {
                const formatted = data["videoIds"].map((item) => ({
                    id: item.id,
                    name: item.title,
                    thumbnail: `${apiUrl}/video/thumbnail/${item.id}/`,
                    url: `${apiUrl}/video/${item.id}/`
                }));
                setVideoSources(formatted);
                const randomVideo = formatted[Math.floor(Math.random() * formatted.length)];
                setParameters(prev => ({
                    ...prev,
                    videoLink: randomVideo.url,
                    videoId: randomVideo.id,
                    videoName: randomVideo.name
                }));
            } catch (error) {
                if (error.name === "AbortError") return;
                showError(error.message, error.statusCode);
            }
        }
        fetchExample();
        return () => controller.abort();
    }, [showError, setParameters]);

    const handleFileChange = (file) => {
        const url = URL.createObjectURL(file);
        if (file.type.startsWith("video/")) {
            setParameters(prev => ({
                ...prev,
                videoLink: url
            }));
        } else {
            showError("Unsupported file format", 400);
        }
    };
    return (
        <div className="video-select">
            {videoSources.map((video) => {
                const isActive = parameters.videoLink === video.url;

                return (
                    <div
                        key={video.id}
                        className={`video-thumbnail ${isActive ? "active" : ""}`}
                        onClick={() => selectVideo(video)}
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
