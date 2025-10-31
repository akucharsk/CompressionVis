import React, { useEffect, useState, useRef } from "react";
import { useFrames } from "../context/FramesContext";
import {apiUrl} from "../utils/urls";
import {useSearchParams} from "react-router-dom";
import '../styles/components/FrameBox.css';
import {handleApiError} from "../utils/errorHandler";
import {useError} from "../context/ErrorContext";
import FrameByFrameNav from "./frameDistribution/FrameByFrameNav";
import PlayCompressedVideoNav from "./frameDistribution/PlayCompressedVideoNav";
import FrameBoxNavigation from "./FrameBoxNavigation";
import { useDisplayMode } from "../context/DisplayModeContext";
import { useVideoPlaying } from "../context/VideoPlayingContext";

const FrameBox = () => {
    const { frames, setFrames, selectedIdx, setSelectedIdx } = useFrames();
    const { displayMode, setDisplayMode } = useDisplayMode();
    const { isVideoPlaying, setIsVideoPlaying } = useVideoPlaying();
    
    const [isLoading, setIsLoading] = useState(true);
    // const [playSpeed] = useState(1);
    const containerRef = useRef(null);
    // const playIntervalRef = useRef(null);
    const [fps, setFps] = useState(30); // domyślnie np. 5 FPS
    // const animationIdRef = useRef(null);

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

    // useEffect(() => {
    //     if (!isVideoPlaying) {
    //         if (playIntervalRef.current) {
    //             clearInterval(playIntervalRef.current);
    //             playIntervalRef.current = null;
    //         }
    //         return;
    //     }

    //     const interval = 1000 / fps;

    //     playIntervalRef.current = setInterval(() => {
    //         setSelectedIdx(prev => {
    //             if (prev < frames.length - 1) {
    //                 return prev + 1;
    //             } else {
    //                 setIsVideoPlaying(false);
    //                 return prev;
    //             }
    //         });
    //     }, interval);

    //     return () => {
    //         if (playIntervalRef.current) {
    //             clearInterval(playIntervalRef.current);
    //         }
    //     };
    // }, [isVideoPlaying, frames.length, playSpeed, fps, setSelectedIdx]);

    // const followFrame = () => {
    //     if (!containerRef.current) return;

    //     const container = containerRef.current;
    //     const selectedFrame = container.children[selectedIdx];
    //     if (!selectedFrame) return;

    //     const containerLeft = container.scrollLeft;
    //     const containerWidth = container.clientWidth;
    //     const frameLeft = selectedFrame.offsetLeft;
    //     const frameWidth = selectedFrame.offsetWidth;

    //     if (frameLeft < containerLeft || frameLeft + frameWidth > containerLeft + containerWidth) {
    //         const targetScroll = frameLeft - (containerWidth / 2) + (frameWidth / 2);
    //         // container.scrollTo({ left: targetScroll, behavior: isVideoPlaying ? 'auto' : 'smooth' });
    //         container.scrollTo({ left: targetScroll, behavior: 'auto' });
    //     }

    //     requestAnimationFrame(followFrame);
    // };

    // const followFrame = () => {
    //     if (!containerRef.current) return;

    //     const container = containerRef.current;
    //     const selectedFrame = container.children[selectedIdx];
    //     if (!selectedFrame) return;

    //     const containerLeft = container.scrollLeft;
    //     const containerWidth = container.clientWidth;
    //     const frameLeft = selectedFrame.offsetLeft;
    //     const frameWidth = selectedFrame.offsetWidth;

    //     if (frameLeft < containerLeft || frameLeft + frameWidth > containerLeft + containerWidth) {
    //         const targetScroll = frameLeft - (containerWidth / 2) + (frameWidth / 2);
    //         container.scrollTo({ left: targetScroll, behavior: 'auto' });
    //     }

    //     if (isVideoPlaying) requestAnimationFrame(followFrame);
    // };

    // useEffect(() => {
    //     if (isVideoPlaying) {
    //         const container = containerRef.current;
    //         if (!container) return;
            
    //         let animationId;

    //         const scroll = () => {
    //             container.scrollLeft += fps / 60 * container.children[selectedIdx].width;
    //             animationId = requestAnimationFrame(scroll);
    //         }

    //         animationId = requestAnimationFrame(scroll);

    //     } else {
            
    //     }
    // }, [isVideoPlaying])

    // useEffect(() => {
    //     const container = containerRef.current;
    //     if (!container) return;

    //     let move = container.children[selectedIdx].offsetWidth * 60 / fps; // px na tick
    //     let animationId;

    //     const scroll = () => {
    //         container.scrollLeft += move;
    //         animationId = requestAnimationFrame(scroll);
    //     };
    //     console.log(move);
    //     if (isVideoPlaying) {
    //         animationId = requestAnimationFrame(scroll);
    //     }

    //     return () => cancelAnimationFrame(animationId);
    // }, [isVideoPlaying]);

    // LAST
    // useEffect(() => {
    //     const container = containerRef.current;
    //     if (!container) return;

    //     let move = container.children[selectedIdx].offsetWidth * 60 / fps; // px na tick
    //     let animationId;

    //     const scroll = () => {
    //         container.scrollLeft += move;
    //         animationId = requestAnimationFrame(scroll);
    //     };
    //     console.log(move);
    //     animationId = requestAnimationFrame(scroll);
        

    //     return () => cancelAnimationFrame(animationId);
    // }, [isVideoPlaying]);



    // useEffect(() => {
    //     let animationFrameId;

    //     const followFrame = () => {
    //         if (!containerRef.current) return;

    //         const container = containerRef.current;
    //         const selectedFrame = container.children[selectedIdx];
    //         if (!selectedFrame) return;

    //         const containerLeft = container.scrollLeft;
    //         const containerWidth = container.clientWidth;
    //         const frameLeft = selectedFrame.offsetLeft;
    //         const frameWidth = selectedFrame.offsetWidth;

    //         if (frameLeft < containerLeft || frameLeft + frameWidth > containerLeft + containerWidth) {
    //             const targetScroll = frameLeft - (containerWidth / 2) + (frameWidth / 2);
    //             container.scrollTo({ left: targetScroll, behavior: 'auto' });
    //         }

    //         if (isVideoPlaying) {
    //             animationFrameId = requestAnimationFrame(followFrame);
    //         }
    //     };

    //     if (isVideoPlaying) {
    //         animationFrameId = requestAnimationFrame(followFrame);
    //     }

    //     return () => {
    //         if (animationFrameId) cancelAnimationFrame(animationFrameId);
    //     } 
    // }, [isVideoPlaying, selectedIdx])

    // useEffect(() => {
    //     if (!isVideoPlaying) {
    //         cancelAnimationFrame(animationIdRef.current);
    //         animationIdRef.current = null;
    //         return;
    //     }

    //     const animate = () => {
    //         followFrame();
    //         animationIdRef.current = requestAnimationFrame(animate);
    //     };

    //     animationIdRef.current = requestAnimationFrame(animate);

    //     return () => cancelAnimationFrame(animationIdRef.current);
    // }, [isVideoPlaying, selectedIdx]);


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
            container.scrollTo({ left: targetScroll, behavior: isVideoPlaying ? 'auto' : 'smooth' });
        }
    }, [selectedIdx, isVideoPlaying]);

    // useEffect(() => {
    //     let animationFrameId
    // }, [selectedIdx])


    // useEffect(() => {
    //     if (!animationIdRef.current) {
    //         animationIdRef.current = requestAnimationFrame(followFrame);
    //     } else {
    //         cancelAnimationFrame(animationIdRef.current);
    //         animationIdRef.current = null;
    //     }
    // }, [isVideoPlaying])

    // useEffect(() => {
    //     const id = requestAnimationFrame(followFrame);
    //     return () => cancelAnimationFrame(id);
    // }, [selectedIdx])

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowLeft') {
                setSelectedIdx(prev => Math.max(0, prev - 1));
            } else if (e.key === 'ArrowRight') {
                setSelectedIdx(prev => Math.min(frames.length - 1, prev + 1));
            } 
            // else if (e.key === ' ') {
            //     e.preventDefault();
            //     setIsVideoPlaying(prev => !prev);
            // }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [frames.length, setSelectedIdx]);

    if (isLoading) {
        return (
            <div className="loading-overlay">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="frames-container">
            <div className="mode-nav">
                <div
                    onClick={() => setDisplayMode("frames")}
                    className={displayMode === "frames" ? "active" : ""}
                >
                    Frames
                </div>
                <div
                    onClick={() => setDisplayMode("video")}
                    className={displayMode === "video" ? "active" : ""}
                >
                    Video
                </div>
                <div className="frame-counter">
                    {selectedIdx + 1} / {frames.length}
                </div>
            </div>
            <div className="timeline-header">
                {/* <div className="timeline-controls">
                    {displayMode === "frames" ? 
                    <FrameByFrameNav
                        frames={frames}
                        selectedIdx={selectedIdx}
                        setSelectedIdx={setSelectedIdx}
                    >
                    </FrameByFrameNav> :
                    <PlayCompressedVideoNav />}
                </div> */}
                <FrameBoxNavigation/>
            </div>

            <div className="timeline-content">
                <div className="scrollable-frameBox" ref={containerRef}>
                    {frames.map((frame, idx) => (
                        <div key={idx} className="frame-container">
                            <div className="time-label">{parseFloat(frame.pts_time).toFixed(2)}s</div>
                            <div
                                className={`frame ${frame.type} ${selectedIdx === idx ? 'selected' : ''}`}
                                onClick={() => {
                                    setSelectedIdx(idx);
                                    setDisplayMode("frames");
                                }}
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

export default FrameBox;