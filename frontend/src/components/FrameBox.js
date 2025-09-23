import React, { useEffect, useState, useRef } from "react";
import { useFrames } from "../context/FramesContext";
import {apiUrl} from "../utils/urls";
import {useSearchParams} from "react-router-dom";
import '../styles/components/FrameBox.css';
import {handleApiError} from "../utils/errorHandler";
import {useError} from "../context/ErrorContext";

const FramesBox = () => {
    const { frames, setFrames, selectedIdx, setSelectedIdx } = useFrames();
    const [isLoading, setIsLoading] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playSpeed] = useState(1);
    const containerRef = useRef(null);
    const playIntervalRef = useRef(null);
    const [fps, setFps] = useState(5); // domyślnie np. 5 FPS
    const [fastForwardIdx, setFastForwardIdx] = useState(1);
    const { showError } = useError();

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
            .then(handleApiError)
            .then(res => res.json())
            .then(data => {
                setFrames(data["frames"]);

                sessionStorage.setItem("frames", JSON.stringify(data["frames"]));
            })
            .catch(err => showError(err.message, err.statusCode))
            .finally(() => setIsLoading(false));

    }, [videoId, setFrames, setSelectedIdx, showError]);

    useEffect(() => {
        if (!isPlaying) {
            if (playIntervalRef.current) {
                clearInterval(playIntervalRef.current);
                playIntervalRef.current = null;
            }
            return;
        }

        const interval = 1000 / fps;

        playIntervalRef.current = setInterval(() => {
            setSelectedIdx(prev => {
                if (prev < frames.length - 1) {
                    return prev + 1;
                } else {
                    setIsPlaying(false);
                    return prev;
                }
            });
        }, interval);

        return () => {
            if (playIntervalRef.current) {
                clearInterval(playIntervalRef.current);
            }
        };
    }, [isPlaying, frames.length, playSpeed, fps, setSelectedIdx]);

    useEffect(() => {
        if (!containerRef.current) return;

        const container = containerRef.current;
        const selectedFrame = container.children[selectedIdx];
        if (!selectedFrame) return;

        const containerLeft = container.scrollLeft;
        const containerWidth = container.clientWidth;
        const frameLeft = selectedFrame.offsetLeft;
        const frameWidth = selectedFrame.offsetWidth;

        if (frameLeft < containerLeft || frameLeft + frameWidth > containerLeft + containerWidth) {
            const targetScroll = frameLeft - (containerWidth / 2) + (frameWidth / 2);
            container.scrollTo({ left: targetScroll, behavior: isPlaying ? 'auto' : 'smooth' });
        }
    }, [selectedIdx, isPlaying]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowLeft') {
                setSelectedIdx(prev => Math.max(0, prev - 1));
            } else if (e.key === 'ArrowRight') {
                setSelectedIdx(prev => Math.min(frames.length - 1, prev + 1));
            } else if (e.key === ' ') {
                e.preventDefault();
                setIsPlaying(prev => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [frames.length, setSelectedIdx]);

    useEffect(() => {

    }, []);

    const handleScrollLeft = () => {
        setSelectedIdx(prev => Math.max(0, prev - 1));
    };

    const handleScrollRight = () => {
        setSelectedIdx(prev => Math.min(frames.length - 1, prev + 1));
    };

    const handleMinusTen = () => {
        setSelectedIdx(prev => Math.max(0, prev - 10));
    }

    const handlePlusTen = () => {
        setSelectedIdx(prev => Math.min(frames.length - 1, prev + 10));
    }

    if (isLoading) {
        return (
            <div className="loading-overlay">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="frames-container">
            <div className="timeline-header">
                <div className="timeline-controls">
                    <button className="scroll-button left" onClick={handleMinusTen}>
                        -10
                    </button>
                    <button className="scroll-button left" onClick={handleScrollLeft}>
                        &lt;
                    </button>
                    <button
                        className={`play-button ${isPlaying ? 'playing' : ''}`}
                        onClick={() => setIsPlaying(prev => !prev)}
                    >
                        {isPlaying ? '⏹ Stop' : '▶ Play'}
                    </button>
                    <button className="scroll-button right" onClick={handleScrollRight}>
                        &gt;
                    </button>
                    <button className="scroll-button right" onClick={handlePlusTen}>
                        +10
                    </button>
                    <div className="speed-control">
                        <label>Speed:</label>
                        <div className="speed-slider-container">
                            <input
                                type="range"
                                min="1"
                                max="15"
                                step="1"
                                value={fps}
                                onChange={(e) => setFps(Number(e.target.value))}
                                className="speed-slider"
                            />
                            <div className="speed-value">{fps} FPS</div>

                        </div>
                    </div>
                    <select
                        value={selectedIdx}
                        onChange={(e) => setSelectedIdx(Number(e.target.value))}
                        className="frame-select"
                    >
                        <option value="" disabled hidden>
                            Fast Forward
                        </option>

                        <optgroup label="Navigation">
                            <option value={0}>⏮ Start</option>
                            <option value={frames.length - 1}>⏭ End</option>
                        </optgroup>

                        <optgroup label="Keyframes (I)">
                            {frames
                                .map((frame, idx) => ({frame, idx}))
                                .filter(({frame}) => frame.type === "I")
                                .filter(({idx}) => idx !== 0)
                                .map(({idx, frame}) => (
                                    <option key={idx} value={idx}>
                                        I-Frame {parseFloat(frame.pts_time).toFixed(2)}s
                                    </option>
                                ))}
                        </optgroup>
                    </select>
                    <div className="frame-counter">
                        {selectedIdx + 1} / {frames.length}
                    </div>
                </div>
            </div>

            <div className="timeline-content">
                <div className="scrollable-frameBox" ref={containerRef}>
                    {frames.map((frame, idx) => (
                        <div key={idx} className="frame-container">
                            <div className="time-label">{parseFloat(frame.pts_time).toFixed(2)}s</div>
                            <div
                                className={`frame ${frame.type} ${selectedIdx === idx ? 'selected' : ''}`}
                                onClick={() => setSelectedIdx(idx)}
                                title={`Frame ${idx} (${frame.type}), Time: ${parseFloat(frame.pts_time).toFixed(2)}s`}
                            >
                                {frame.type}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FramesBox;