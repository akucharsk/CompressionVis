import React, { useEffect, useRef } from "react";
import { useFrames } from "../context/FramesContext";
import {useSearchParams} from "react-router-dom";
import '../styles/components/FrameBox.css';
import FrameBoxNavigation from "./FrameBoxNavigation";
import { useVideoPlaying } from "../context/VideoPlayingContext";
import Spinner from "./Spinner";
import IndicatorBlock from "./indicators/IndicatorBlock";
import { INDICATOR_OPTIONS } from "../utils/constants";

const FrameBox = () => {
    const { isVideoPlaying } = useVideoPlaying();
    const containerRef = useRef(null);

    const [searchParams] = useSearchParams();
    const indicators = searchParams.get("indicators")?.split(",")?.filter(indicator => indicator in INDICATOR_OPTIONS) || [];

    const {
        frames,
        framesQuery,
        selectedIdx,
        setSelectedIdx,
        sceneThreshold,
        setSceneThreshold,
        scenePositions,
    } = useFrames();

    useEffect(() => {
        if (!containerRef.current) return;

        const container = containerRef.current;
        const nearestScene = scenePositions.reduce((acc, idx) => idx < selectedIdx ? idx : acc);
        const selectedFrame = container.children[selectedIdx + scenePositions.indexOf(nearestScene)];
        if (!selectedFrame) return;

        const containerLeft = container.scrollLeft;
        const containerWidth = container.clientWidth;
        const frameLeft = selectedFrame.offsetLeft;
        const frameWidth = selectedFrame.offsetWidth;

        if (frameLeft < containerLeft || frameLeft + frameWidth > containerLeft + containerWidth) {
            const targetScroll = frameLeft - (containerWidth / 2) + (frameWidth / 2);
            container.scrollTo({ left: targetScroll, behavior: isVideoPlaying ? 'auto' : 'smooth' });
        }
    }, [selectedIdx, isVideoPlaying, scenePositions]);

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
                        <>
                        { frame.scene_score >= sceneThreshold && <div className="scene-indicator"></div> }
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
                        </>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FrameBox;