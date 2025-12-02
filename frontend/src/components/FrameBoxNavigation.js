import {useEffect, useRef, useState, useMemo, useCallback} from "react";
import { useDisplayMode } from "../context/DisplayModeContext";
import { useFps } from "../context/FpsContext";
import { useFrames } from "../context/FramesContext";
import { useVideoPlaying } from "../context/VideoPlayingContext";
import IndicatorConfig from "./indicators/IndicatorConfig";
import {useMetrics} from "../context/MetricsContext";

const FrameBoxNavigation = ({ sceneThreshold, setSceneThreshold }) => {
    const { frames, selectedIdx, setSelectedIdx } = useFrames();
    const { isVideoPlaying, setIsVideoPlaying } = useVideoPlaying();
    const { setDisplayMode } = useDisplayMode();
    const { fps, setFps } = useFps();
    const [frameInput, setFrameInput] = useState((selectedIdx + 1).toString());
    const inputSelectedIdxRef = useRef(null);
    const { videoMetricsQuery } = useMetrics();
    const loadingFields = videoMetricsQuery.isPending ? [ "psnr", "ssim", "vmaf" ] : [];

    const iFramePositions = useMemo(() => {
        return frames
            .map((frame, idx) => ({ frame, idx }))
            .filter(({ frame }) => frame.type === "I")
            .map(({ idx }) => idx);
    }, [frames]);

    const scenePositions = useMemo(() => {
        return frames
            .map((frame, idx) => ({ frame, idx }))
            .filter(({ frame }) => frame.scene_score >= sceneThreshold)
            .map(({ idx }) => idx);
    }, [frames, sceneThreshold]);

    console.log({ iFramePositions, scenePositions });

    useEffect(() => {
        setFrameInput((selectedIdx + 1).toString());
    }, [selectedIdx]);

    const handleScrollLeft = useCallback(() => {
        setDisplayMode("frames");
        setSelectedIdx(prev => Math.max(0, prev - 1));
    }, [setDisplayMode, setSelectedIdx]);

    const handleScrollRight = useCallback(() => {
        setDisplayMode("frames");
        setSelectedIdx(prev => Math.min(frames.length - 1, prev + 1));
    }, [frames.length, setDisplayMode, setSelectedIdx]);

    const handlePlay = useCallback(() => {
        setIsVideoPlaying(true);
        setDisplayMode("video");
    }, [setIsVideoPlaying, setDisplayMode]);

    const handlePause = useCallback(() => {
        setIsVideoPlaying(false);
        setDisplayMode("frames");
    }, [setIsVideoPlaying, setDisplayMode]);

    const handleRestart = useCallback(() => {
        setSelectedIdx(0);
    }, [setSelectedIdx]);

    const switchIFrame = useCallback((direction) => {
        if (iFramePositions.length === 0) return;
        if (direction === "next") {
            setSelectedIdx((iFramePositions.find(idx => idx > selectedIdx) ?? iFramePositions[0]));
        } else {
            setSelectedIdx((iFramePositions.find(idx => idx < selectedIdx) ?? iFramePositions[iFramePositions.length - 1]));
        }
    }, [iFramePositions, selectedIdx, setSelectedIdx]);

    const switchScene = useCallback((direction) => {
        if (scenePositions.length === 0) return;
        if (direction === "next") {
            setSelectedIdx((scenePositions.find(idx => idx > selectedIdx) ?? scenePositions[0]));
        } else {
            setSelectedIdx((scenePositions.find(idx => idx < selectedIdx) ?? scenePositions[scenePositions.length - 1]));
        }
    }, [scenePositions, selectedIdx, setSelectedIdx]);

    const handleFrameInputChange = useCallback((e) => {
        const val = e.target.value;

        if (val === '') {
            setFrameInput(val);
            return;
        }

        const num = parseInt(val, 10);

        if (isNaN(num) || num < 1) {
            return;
        }

        if (num > frames.length) {
            const clampedValue = frames.length;
            setSelectedIdx(clampedValue - 1);
            setFrameInput(clampedValue.toString());
            return;
        }

        setSelectedIdx(num - 1);
        setFrameInput(val);
    }, [frames.length, setSelectedIdx, setFrameInput]);

    const handleFrameInputBlur = useCallback(() => {
        if (frameInput === '') {
            setFrameInput((selectedIdx + 1).toString());
        }
    }, [selectedIdx, setFrameInput, frameInput]);

    const handleFrameInputKeyDown = useCallback((e) => {
        if (e.key === 'Enter') {
            e.target.blur();
        }
    }, []);

    useEffect(() => {
        const inputSelectedIdx = inputSelectedIdxRef.current;

        if (!inputSelectedIdx) return;

        inputSelectedIdx.value = selectedIdx + 1;
    }, [selectedIdx])

    useEffect(() => {
        const min = 6;
        const max = 30;
        const percent = ((fps - min) / (max - min)) * 100;
        document.documentElement.style.setProperty("--percent", `${percent}%`);
    }, [fps]);

    useEffect(() => {
        const min = 0;
        const max = 1;
        const percent = ((sceneThreshold - min) / (max - min)) * 100;
        document.documentElement.style.setProperty("--scene-percent", `${percent}%`);
    }, [sceneThreshold]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            const inputSelectedIdx = inputSelectedIdxRef.current;

            if (inputSelectedIdx === document.activeElement) return;

            if (e.key === 'ArrowLeft') {
                setSelectedIdx(prev => Math.max(0, prev - 1));
            } else if (e.key === 'ArrowRight') {
                setSelectedIdx(prev => Math.min(frames.length - 1, prev + 1));
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [frames.length, setSelectedIdx]);

    return (
        <div className="timeline-header">
            <div className="control-group navigation-group">
                <div className="navigation">
                    <button className="scroll-button left" onClick={handleScrollLeft}>&lt;</button>
                    {isVideoPlaying ? (
                        <button className="play-button playing" onClick={handlePause}>❚❚</button>
                    ) : selectedIdx === frames.length - 1 ? (
                        <button className="play-button" onClick={handleRestart}>⟳</button>
                    ) : (
                        <button className="play-button" onClick={handlePlay}>▶</button>
                    )}
                    <button className="scroll-button right" onClick={handleScrollRight}>&gt;</button>
                </div>

                <div className="speed-control">
                    <label>Speed: </label>
                    <div className="speed-slider-container">
                        <input
                            type="range"
                            min="6"
                            max="30"
                            value={fps}
                            onChange={(e) => setFps(Number(e.target.value))}
                            className="speed-slider"
                        />
                        <div className="speed-value"> {fps} FPS</div>
                    </div>
                </div>
            </div>

            <div className="control-group playback-group">
                <div className="frame-counter">
                    <div className="frame-counter-label">Frame</div>
                    <div className="frame-counter-content">
                        <input
                            type="number"
                            min={1}
                            max={frames.length}
                            value={frameInput}
                            onChange={handleFrameInputChange}
                            onBlur={handleFrameInputBlur}
                            onKeyDown={handleFrameInputKeyDown}
                        />
                        <span>/ {frames.length}</span>
                    </div>
                </div>
            </div>

            <div className="control-group additional-group">
                <div className="control-buttons">
                    <div style={{ display: "flex"}}>
                        <button className="scroll-button i-frame" onClick={() => switchIFrame("prev")}>
                            <p>Prev I-Frame</p>
                        </button>
                        <button className="scroll-button i-frame" onClick={() => switchIFrame("next")}>
                            <p>Next I-Frame</p>
                        </button>
                    </div>
                    <div style={{ display: "flex"}}>
                        <button 
                            className="scroll-button next-scene" 
                            onClick={() => switchScene("prev")}
                            disabled={scenePositions.length === 0}
                        >
                            <p>Prev Scene</p>
                        </button>
                        <button 
                            className="scroll-button next-scene"
                            onClick={() => switchScene("next")}
                            disabled={scenePositions.length === 0}
                        >
                            <p>Next Scene</p>
                        </button>
                    </div>
                    <div className="scene-slider-container">
                        <input
                            type="range" 
                            min={0} 
                            max={1} 
                            step={0.01} 
                            value={sceneThreshold} 
                            onChange={(e) => setSceneThreshold(Number(e.target.value))} 
                            className="scene-slider"
                        />
                        <div style={{ margin: "auto", fontWeight: "bold", display: "flex", justifyContent: "space-between", width: "100%" }}>
                            <span>Scene Threshold: </span>
                            <span style={{ color: "var(--netflix-red)" }}>{sceneThreshold.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
                <IndicatorConfig loadingFields={loadingFields} />
            </div>
        </div>
    )
}

export default FrameBoxNavigation;