import React, { useEffect, useState } from "react";
import {useSettings} from "../../context/SettingsContext";
import FileDropZone from "./FileDropZone";
import {apiUrl} from "../../utils/urls";
import "../../styles/components/video/VideoSelect.css";

const VideoSelect = () => {
    const [videoSources, setVideoSources] = useState([]);
    const { parameters, setParameters } = useSettings();

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
        fetch(`${apiUrl}/video/example/`, { signal: controller.signal })
            .then((res) => res.json())
            .then((data) => {
                console.log(data);
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
            })
            .catch((error) => console.error("Failed to fetch video sources:", error));

        return () => controller.abort();

    }, []);

    const handleFileChange = (file) => {
        const url = URL.createObjectURL(file);
        if (file.type.startsWith("video/")) {
            setParameters(prev => ({
                ...prev,
                videoLink: url
            }));
        } else {
            alert("Unsupported file format");
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
