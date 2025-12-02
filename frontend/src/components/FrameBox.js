import React, { useEffect, useState, useRef } from "react";
import { useFrames } from "../context/FramesContext";
import {useSearchParams} from "react-router-dom";
import '../styles/components/FrameBox.css';
import {handleApiError} from "../utils/errorHandler";
import {useError} from "../context/ErrorContext";
import PlayCompressedVideoNav from "./frameDistribution/PlayCompressedVideoNav";
import FrameBoxNavigation from "./FrameBoxNavigation";
import { useDisplayMode } from "../context/DisplayModeContext";
import { useVideoPlaying } from "../context/VideoPlayingContext";
import { useFps } from "../context/FpsContext";
import Spinner from "./Spinner";
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
    const [sceneThreshold, setSceneThreshold] = useState(0.4);

    const {
        frames,
        framesQuery,
        selectedIdx,
        setSelectedIdx,
    } = useFrames();

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

    if (framesQuery.isPending) {
        return (
            <div className="loading-overlay">
                <Spinner />
            </div>
        );
    }

    return (
        <div className="frames-container">
            <FrameBoxNavigation sceneThreshold={sceneThreshold} setSceneThreshold={setSceneThreshold} />
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
                        <div key={idx} className={`frame-container ${selectedIdx === idx ? 'selected' : ''}`}>
                            <div
                                className={`frame ${frame.type} ${selectedIdx === idx ? 'selected' : ''} ${frame.scene_score >= sceneThreshold ? 'scene' : ''}`}
                                onClick={() => setSelectedIdx(idx)}
                                title={`Frame ${idx} (${frame.type}), Time: ${parseFloat(frame.pts_time).toFixed(2)}s`}
                            >
                                <div className="frame-time">{parseFloat(frame.pts_time).toFixed(2)}s</div>
                                <div className="frame-type">{frame.type}</div>
                                <div className="frame-number">#{String(idx + 1).padStart(3, '0')}</div>
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