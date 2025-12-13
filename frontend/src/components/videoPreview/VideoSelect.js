import React, { useEffect } from "react";
import {useSettings} from "../../context/SettingsContext";
import "../../styles/components/video/VideoSelect.css";
import {useError} from "../../context/ErrorContext";
import Spinner from "../Spinner";
import { useOriginalVideos } from "../../hooks/original-videos";

const VideoSelect = () => {
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

    const { data, isPending, error } = useOriginalVideos();

    useEffect(() => {
        if (error) {
            showError(error.message, error.status);
        }
    }, [ error, showError ]);

    return (
        <div className="video-select">
            {data?.map((video) => {
                const isActive = parameters.videoLink === video.url;
                if (isPending) {
                    return (
                        <div className="video-thumbnail">
                            <Spinner />
                        </div>
                    );
                }

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
        </div>
    );
};

export default VideoSelect;
