import React, {useState, useEffect, useRef, useCallback} from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { genericFetch } from "../api/genericFetch";
import { apiUrl } from "../utils/urls";
import Spinner from "../components/Spinner";
import "../styles/pages/FrameDifferences.css";

const VIEW_MODES = [
    { key: "original_frame", label: "Original" },
    { key: "diff_prev_frame", label: "Diff (N vs N-1)" },
    { key: "diff_third_frame", label: "Residual" }
];

const FrameDifferences = () => {
    const [searchParams] = useSearchParams();
    const videoId = searchParams.get("videoId");

    const [currentFrame, setCurrentFrame] = useState(0);
    const [debouncedFrame, setDebouncedFrame] = useState(0);
    const [viewModeKey, setViewModeKey] = useState("original_frame");
    const [frameInput, setFrameInput] = useState("1");

    const stripRef = useRef(null);

    const { data: countData, isPending: isCountPending } = useQuery({
        queryKey: ["diffCount", videoId],
        queryFn: () => genericFetch(`${apiUrl}/difference/${videoId}/`),
        enabled: !!videoId
    });

    const totalFrames = countData?.count || 0;

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedFrame(currentFrame);
        }, 500);

        return () => {
            clearTimeout(handler);
        };
    }, [currentFrame]);

    const { data: imagesData, isFetching } = useQuery({
        queryKey: ["diffImages", videoId, debouncedFrame],
        queryFn: () => genericFetch(`${apiUrl}/difference/${videoId}/${debouncedFrame}/`),
        enabled: !!videoId && totalFrames > 0,
        placeholderData: keepPreviousData,
    });

    useEffect(() => {
        if (currentFrame === 0 && viewModeKey !== "original_frame") {
            setViewModeKey("original_frame");
        }
        setFrameInput((currentFrame + 1).toString());
        scrollToFrame(currentFrame);
    }, [currentFrame, viewModeKey]);

    const changeFrame = useCallback((delta) => {
        setCurrentFrame(prev => {
            const newState = prev + delta;
            if (newState < 0) return 0;
            if (newState >= totalFrames) return totalFrames > 0 ? totalFrames - 1 : 0;
            return newState;
        });
    }, [totalFrames]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.target.tagName === "INPUT") return;

            if (e.key === "ArrowLeft") {
                changeFrame(-1);
            } else if (e.key === "ArrowRight") {
                changeFrame(1);
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [totalFrames, changeFrame])

    const scrollToFrame = (index) => {
        if (stripRef.current) {
            const button = stripRef.current.children[index];
            if (button) {
                const containerCenter = stripRef.current.clientWidth / 2;
                const buttonCenter = button.offsetLeft + button.clientWidth / 2;
                stripRef.current.scrollTo({
                    left: buttonCenter - containerCenter,
                    behavior: "smooth"
                });
            }
        }
    };

    const handleInputSubmit = (e) => {
        if (e.key === 'Enter') {
            e.target.blur();
        }
    };

    const handleInputBlur = () => {
        let val = parseInt(frameInput);
        if (isNaN(val)) val = 1;
        if (val < 1) val = 1;
        if (val > totalFrames) val = totalFrames;
        setCurrentFrame(val - 1);
        setFrameInput(val.toString());
    };


    if (isCountPending) return <div className="loading-overlay"><Spinner /></div>;

    const imageSrc = imagesData ? `data:image/png;base64,${imagesData[viewModeKey]}` : null;
    const isFrameOne = currentFrame === 0;
    const isImageLoading = debouncedFrame !== currentFrame || isFetching;

    return (
        <div className="diff-container">
            <div className="diff-frames-strip" ref={stripRef}>
                {Array.from({ length: totalFrames }).map((_, idx) => (
                    <button
                        key={idx}
                        className={`diff-frame ${idx === currentFrame ? 'selected' : ''}`}
                        onClick={() => setCurrentFrame(idx)}
                    >
                        {String(idx + 1).padStart(3, '0')}
                    </button>
                ))}
            </div>

            <div className="diff-viewer">
                <button className="diff-arrow" onClick={() => changeFrame(-1)}>◀</button>

                {imageSrc ? (
                    <img
                        src={imageSrc}
                        alt="Frame View"
                        className="diff-image"
                        style={{ opacity: isImageLoading ? 0.6 : 1, transition: 'opacity 0.2s' }}
                    />
                ) : (
                    <Spinner />
                )}

                <button className="diff-arrow" onClick={() => changeFrame(1)}>▶</button>
            </div>

            <div className="diff-controls">
                <div className="frame-counter">
                    <span>Frame:</span>
                    <input
                        type="number"
                        min={1}
                        max={totalFrames}
                        value={frameInput}
                        onChange={(e) => setFrameInput(e.target.value)}
                        onBlur={handleInputBlur}
                        onKeyDown={handleInputSubmit}
                    />
                    <span>/ {totalFrames}</span>
                </div>

                <div className="view-modes">
                    {VIEW_MODES.map((mode) => {
                        const isDisabled = isFrameOne && mode.key !== 'original_frame';
                        return (
                            <button
                                key={mode.key}
                                className={`mode-btn ${viewModeKey === mode.key ? 'active' : ''}`}
                                onClick={() => setViewModeKey(mode.key)}
                                disabled={isDisabled}
                            >
                                {mode.label}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default FrameDifferences;