import React, { useCallback, useEffect, useState } from "react";
import {useSettings} from "../../context/SettingsContext";
import {apiUrl} from "../../utils/urls";
import "../../styles/components/video/VideoSelect.css";
import {useError} from "../../context/ErrorContext";
import { genericFetch } from "../../api/genericFetch";
import { useQuery } from "@tanstack/react-query";
import { defaultRetryPolicy, defaultRefetchIntervalPolicy } from "../../utils/retryUtils";
import Spinner from "../Spinner";

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

    const queryFn = useCallback(async () => {
        const data = await genericFetch(`${apiUrl}/video/example/`);
        const formattedData = data["videoIds"].map((item) => ({
            id: item.id,
            name: item.title,
            thumbnail: `${apiUrl}/video/thumbnail/${item.id}/`,
            url: `${apiUrl}/video/${item.id}/`
        }));
        const randomVideo = formattedData[Math.floor(Math.random() * formattedData.length)];
        setParameters(prev => ({
            ...prev,
            videoLink: randomVideo.url,
            videoId: randomVideo.id,
            videoName: randomVideo.name
        }));
        return formattedData;
    }, [ setParameters ]);

    const { data, isPending, error } = useQuery({
        queryKey: [ "videoExample" ],
        queryFn,
        retry: defaultRetryPolicy,
        refetchInterval: defaultRefetchIntervalPolicy
    });

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
