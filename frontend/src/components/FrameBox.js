import React, { useEffect, useState } from "react";
import { useSettings } from "../context/SettingsContext";
import { useFrames } from "../context/FramesContext";

const FramesBox = () => {
    const { parameters } = useSettings();
    const { frames, setFrames, selectedIdx, setSelectedIdx } = useFrames();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const cachedFrames = sessionStorage.getItem('frames');
        if (cachedFrames) {
            setFrames(JSON.parse(cachedFrames));
            setIsLoading(false);
        } else if (parameters.videoName) {
            fetch(`http://127.0.0.1:8000/video/frames/${parameters.videoName}`)
                .then((res) => res.json())
                .then((data) => {
                    const first42 = (data || []).slice(0, 42);
                    setFrames(first42);
                    sessionStorage.setItem('frames', JSON.stringify(first42));
                })
                .catch((error) => console.error("Failed to fetch frames:", error))
                .finally(() => setIsLoading(false));
        }
    }, [parameters.videoName, setFrames]);

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