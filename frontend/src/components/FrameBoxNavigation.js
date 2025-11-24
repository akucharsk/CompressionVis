import {useEffect, useRef, useState} from "react";
import { useDisplayMode } from "../context/DisplayModeContext";
import { useFps } from "../context/FpsContext";
import { useFrames } from "../context/FramesContext";
import { useVideoPlaying } from "../context/VideoPlayingContext";
import IndicatorConfig from "./indicators/IndicatorConfig";
import {useMetrics} from "../context/MetricsContext";

const FrameBoxNavigation = () => {
    const { frames, selectedIdx, setSelectedIdx } = useFrames();
    const { isVideoPlaying, setIsVideoPlaying } = useVideoPlaying();
    const { setDisplayMode } = useDisplayMode();
    const { fps, setFps } = useFps();
    const [frameInput, setFrameInput] = useState((selectedIdx + 1).toString());
    const inputSelectedIdxRef = useRef(null);
    const { videoMetricsQuery } = useMetrics();

    const loadingFields = videoMetricsQuery.isPending ? [ "psnr", "ssim", "vmaf" ] : [];

    useEffect(() => {
        setFrameInput((selectedIdx + 1).toString());
    }, [selectedIdx]);

    const handleScrollLeft = () => {
        setDisplayMode("frames");
        setSelectedIdx(prev => Math.max(0, prev - 1));
    };

    const handleScrollRight = () => {
        setDisplayMode("frames");
        setSelectedIdx(prev => Math.min(frames.length - 1, prev + 1));
    };

    const handlePlay = () => {
        setIsVideoPlaying(true);
        setDisplayMode("video");
    };

    const handlePause = () => {
        setIsVideoPlaying(false);
        setDisplayMode("frames");
    };

    const handleRestart = () => {
        setSelectedIdx(0);
    };

    const handleNextIFrame = () => {
        if (frames.length === 0) return;
        const iFrames = frames
            .map((frame, idx) => ({ frame, idx }))
            .filter(({ frame }) => frame.type === "I")
            .map(({ idx }) => idx);

        if (iFrames.length === 0) return;
        const currentPos = iFrames.indexOf(selectedIdx);
        const nextPos = (currentPos + 1) % iFrames.length;
        setSelectedIdx(iFrames[nextPos]);
    }

    const handleFrameInputChange = (e) => {
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
    };

    const handleFrameInputBlur = () => {
        if (frameInput === '') {
            setFrameInput((selectedIdx + 1).toString());
        }
    };

    const handleFrameInputKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.target.blur();
        }
    };

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
                            step="6"
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
                    <button className="scroll-button i-frame" onClick={handleNextIFrame}>
                        <p>Next I-Frame</p>
                    </button>
                    <button className="scroll-button next-scene">
                        <p>Next Scene</p>
                    </button>
                </div>
                <IndicatorConfig loadingFields={loadingFields} />
            </div>
        </div>
    )
}

export default FrameBoxNavigation;