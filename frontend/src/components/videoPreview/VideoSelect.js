import React, { useEffect, useRef, useState } from "react";
import {useSettings} from "../../context/SettingsContext";
import FileDropZone from "./FileDropZone";
import {apiUrl} from "../../utils/urls";

const VideoSelect = () => {
    const [videoSources, setVideoSources] = useState([]);
    const { parameters, setParameters } = useSettings();

    const selectVideo = (url) => {
        setParameters({
            ...parameters,
            videoLink: url,
            videoId: parseInt(url.split('/').at(-2))
        });
    };

    useEffect(() => {
        const controller = new AbortController();
        fetch(`${apiUrl}/video/example/`, { signal: controller.signal })
            .then((res) => res.json())
            .then((data) => {
                console.log(data);
                const formatted = data["videoIds"].map((item) => ({
                    id: item.id,
                    name: item.filename,
                    thumbnail: `${apiUrl}/video/thumbnail/${item.id}/`,
                    url: `${apiUrl}/video/${item.id}/`
                }));
                setVideoSources(formatted);
            })
            .catch((error) => console.error("Failed to fetch video sources:", error));

        return () => controller.abort();

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
