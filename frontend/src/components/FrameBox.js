import React, { useEffect, useState } from "react";
import { useFrames } from "../context/FramesContext";
import {apiUrl} from "../utils/urls";
import {useSearchParams} from "react-router-dom";

const FramesBox = () => {
    const { frames, setFrames, selectedIdx, setSelectedIdx } = useFrames();
    const [isLoading, setIsLoading] = useState(true);
    const [params] = useSearchParams();
    const videoId = params.get("videoId");

    useEffect( () => {
        const cachedFrames = sessionStorage.getItem("frames");
        if (cachedFrames) {
            setFrames(JSON.parse(cachedFrames));
            setIsLoading(false);
            return;
        }
        fetch(`${apiUrl}/video/frames/${videoId}/`)
            .then(res => res.json())
            .then(data => {
                setFrames(data["frames"]);
                sessionStorage.setItem("frames", JSON.stringify(data["frames"]));
            })
            .catch(console.error)
            .finally(() => setIsLoading(false));

    }, [videoId, setFrames]);

    if (isLoading) {
        return (
            <div className="loading-overlay">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="timeline-container">
            <div className="time-labels">
                {Array.from({length: 42}, (_, i) => (
                    <div key={i} className="time-label">{(i * 0.04).toFixed(2)}</div>
                ))}
            </div>
            <div className="frameBox">
                {frames.map((frame, idx) => (
                    <div
                        key={idx}
                        className={`frame ${frame.type} ${selectedIdx === idx ? 'selected' : ''}`}
                        onClick={() => setSelectedIdx(idx)}
                        title={`Frame ${idx} (${frame.type}), Time: ${frame.pts_time}s`}
                    >
                        {frame.type}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FramesBox;