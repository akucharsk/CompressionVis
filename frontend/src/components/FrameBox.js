import React, { useEffect, useState, useRef } from "react";
import { useFrames } from "../context/FramesContext";
import {useSearchParams} from "react-router-dom";
import '../styles/components/FrameBox.css';
import {handleApiError} from "../utils/errorHandler";
import {useError} from "../context/ErrorContext";
import FrameByFrameNav from "./frameDistribution/FrameByFrameNav";
import PlayCompressedVideoNav from "./frameDistribution/PlayCompressedVideoNav";
import FrameBoxNavigation from "./FrameBoxNavigation";
import { useDisplayMode } from "../context/DisplayModeContext";
import { useVideoPlaying } from "../context/VideoPlayingContext";
import { useFps } from "../context/FpsContext";
import Spinner from "./Spinner";
import IndicatorConfig from "./indicators/IndicatorConfig";
import IndicatorBlock from "./indicators/IndicatorBlock";
import { useMetrics } from "../context/MetricsContext";
import { INDICATOR_OPTIONS } from "../utils/constants";

const FrameBox = () => {
    const { displayMode, setDisplayMode } = useDisplayMode();
    const { isVideoPlaying, setIsVideoPlaying } = useVideoPlaying();
    const { showError } = useError();

    const [isLoading, setIsLoading] = useState(true);
    const containerRef = useRef(null);

    const [params] = useSearchParams();
    const videoId = params.get("videoId");

    const [searchParams] = useSearchParams();
    const indicators = searchParams.get("indicators")?.split(",")?.filter(indicator => indicator in INDICATOR_OPTIONS) || [];

    const {
        frames,
        framesQuery,
        selectedIdx,
        setSelectedIdx,
    } = useFrames();

    const { videoMetricsQuery } = useMetrics();

    const loadingFields = videoMetricsQuery.isPending ? [ "psnr", "ssim", "vmaf" ] : [];

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

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowLeft') {
                
                setSelectedIdx(prev => Math.max(0, prev - 1));
            } else if (e.key === 'ArrowRight') {
                setSelectedIdx(prev => Math.min(frames.length - 1, prev + 1));
            } 
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [frames.length, setSelectedIdx]);

    if (framesQuery.isPending) {
        return (
            <div className="loading-overlay">
                <Spinner />
            </div>
        );
    }

    return (
        <div className="frames-container">
            <FrameBoxNavigation />
            <IndicatorConfig loadingFields={loadingFields} />
            <div className="timeline-content">
                <div className="indicator-labels">
                    {[...indicators].reverse().map((indicator, i) => (
                        <div key={i} className="indicator-label">
                            {indicator.toUpperCase()}
                        </div>
                    ))}
                </div>
                <div className="scrollable-frameBox" ref={containerRef}>
                    {frames?.map((frame, idx) => (
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
                            { indicators.map((indicator, i) => (
                                <IndicatorBlock indicator={indicator} key={i} frameNumber={idx} />
                            )) }
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FrameBox;