import React, { useEffect, useState, useRef } from "react";
import { useFrames } from "../context/FramesContext";
import {apiUrl} from "../utils/urls";
import {useSearchParams} from "react-router-dom";
import '../styles/components/FrameBox.css';

const FramesBox = ({ filename }) => {
    const { frames, setFrames, selectedIdx, setSelectedIdx } = useFrames();
    const [isLoading, setIsLoading] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playSpeed, setPlaySpeed] = useState(1);
    const containerRef = useRef(null);
    const playIntervalRef = useRef(null);
    const [fps, setFps] = useState(5); // domyślnie np. 5 FPS

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
    }, [isPlaying, frames.length, playSpeed]);

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
    }, [frames.length]);

    const handleScrollLeft = () => {
        setSelectedIdx(prev => Math.max(0, prev - 1));
    };

    const handleScrollRight = () => {
        setSelectedIdx(prev => Math.min(frames.length - 1, prev + 1));
    };

    const handleScrollFarLeft = () => {
        setSelectedIdx(0);
        const container = containerRef.current;
        if (container) {
            container.scrollTo({ left: 0, behavior: 'smooth' });
        }
    }

    const handleScrollFarRight = () => {
        setSelectedIdx(frames.length - 1);
        const container = containerRef.current;
        if (container) {
            container.scrollTo({ left: container.scrollWidth, behavior: 'smooth' });
        }
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
                    <button className="scroll-button left" onClick={handleScrollFarLeft}>
                        &laquo;
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
                    <button className="scroll-button right" onClick={handleScrollFarRight}>
                        &raquo;
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
                                title={`Frame ${idx} (${frame.type}), Time: ${frame.pts_time}s`}
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