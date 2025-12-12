import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { genericFetch } from "../api/genericFetch";
import { apiUrl } from "../utils/urls";
import Spinner from "../components/Spinner";
import "../styles/pages/FrameDifferences.css";
import "../styles/components/FrameBox.css";

const VIEW_MODES = [
    { key: "original_frame", label: "Original" },
    { key: "diff_prev_frame", label: "Diff (N vs N-1)" },
    { key: "diff_third_frame", label: "Residual" }
];

const FrameDifferences = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const videoId = searchParams.get("videoId");

    const [currentFrame, setCurrentFrame] = useState(0);
    const [viewModeKey, setViewModeKey] = useState("original_frame");
    const [frameInput, setFrameInput] = useState("1");

    const stripRef = useRef(null);

    const { data: countData, isPending: isCountPending } = useQuery({
        queryKey: ["diffCount", videoId],
        queryFn: () => genericFetch(`${apiUrl}/difference/${videoId}/`),
        enabled: !!videoId
    });

    const totalFrames = countData?.count || 0;

    const { data: imagesData} = useQuery({
        queryKey: ["diffImages", videoId, currentFrame],
        queryFn: () => genericFetch(`${apiUrl}/difference/${videoId}/${currentFrame}/`),
        enabled: !!videoId && totalFrames > 0,
        placeholderData: keepPreviousData,
    });

    useEffect(() => {
        if (currentFrame === 0 && viewModeKey !== "original_frame") {
            setViewModeKey("original_frame");
        }
        setFrameInput((currentFrame + 1).toString());
        scrollToFrame(currentFrame);
    }, [currentFrame]);

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

    const changeFrame = (delta) => {
        setCurrentFrame(prev => {
            const newState = prev + delta;
            if (newState < 0) return 0;
            if (newState >= totalFrames) return totalFrames - 1;
            return newState;
        });
    };

    if (isCountPending) return <div className="loading-overlay"><Spinner /></div>;

    const imageSrc = imagesData ? `data:image/png;base64,${imagesData[viewModeKey]}` : null;
    const isFrameOne = currentFrame === 0;

    return (
        <div className="diff-container">
            <div className="diff-top-bar">
                <button className="diff-return-btn" onClick={() => navigate("/")} title="Back to Menu">
                    ↩
                </button>
                <div className="diff-strip-wrapper">
                    <div className="scrollable-frameBox diff-strip" ref={stripRef}>
                        {Array.from({ length: totalFrames }).map((_, idx) => (
                            <div key={idx} className={`frame-container compact ${idx === currentFrame ? 'selected' : ''}`}>
                                <div
                                    className={`frame neutral compact ${idx === currentFrame ? 'selected' : ''}`}
                                    onClick={() => setCurrentFrame(idx)}
                                >
                                    {String(idx + 1).padStart(3, '0')}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="diff-main-view">
                <button className="diff-arrow left" onClick={() => changeFrame(-1)} title="Previous">❮</button>

                <div className="diff-image-area">
                    {imageSrc ? (
                        <img
                            src={imageSrc}
                            alt="Frame View"
                            className="diff-display-image"
                        />
                    ) : (
                        <Spinner />
                    )}
                </div>

                <button className="diff-arrow right" onClick={() => changeFrame(1)} title="Next">❯</button>
            </div>

            <div className="diff-controls">
                <div className="frame-counter compact">
                    <div className="frame-counter-content">
                        <span>Frame: </span>
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
                </div>

                <div className="diff-mode-group">
                    {VIEW_MODES.map((mode) => {
                        const isDisabled = (isFrameOne && mode.key !== 'original_frame') || viewModeKey === mode.key;
                        return (
                            <button
                                key={mode.key}
                                className={`diff-mode-btn compact ${viewModeKey === mode.key ? 'active' : ''}`}
                                onClick={() => setViewModeKey(mode.key)}
                                disabled={isDisabled}
                                title={isFrameOne && mode.key !== 'original_frame' ? "Not available for first frame" : ""}
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