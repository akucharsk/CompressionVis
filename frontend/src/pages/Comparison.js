import FrameBox from "../components/FrameBox";
import {useEffect, useRef, useState} from "react";
import ImageBlockSelect from "../components/comparison/ImageBlockSelect";
import ImageDetails from "../components/comparison/ImageDetails";
import './../styles/pages/Comparison.css';

import {useFrames} from "../context/FramesContext";
import {apiUrl} from "../utils/urls";
import {useSearchParams} from "react-router-dom";
import {fetchImage} from "../api/fetchImage";
import {MAX_RETRIES} from "../utils/constants";
import Parameters from "../components/Parameters";
import {useError} from "../context/ErrorContext";
import {handleApiError} from "../utils/errorHandler";
import { useDisplayMode } from "../context/DisplayModeContext";
import VideoPlayerForAnalysis from "../components/frameDistribution/VideoPlayerForAnalysis";
import "../styles/pages/Comparison.css";
import { useMetrics } from "../context/MetricsContext";
import ImageBlock from "../components/comparison/ImageBlock";

const Comparison = () => {
    const { displayMode } = useDisplayMode();

    const [selectedType, setSelectedType] = useState("H.265");
    const [params] = useSearchParams();
    const {showError} = useError();

    const videoId = params.get("videoId");
    const originalVideoId = params.get("originalVideoId");
    const { selectedIdx, setSelectedIdx, frames } = useFrames();
    const [fullscreenSide, setFullscreenSide] = useState(null);

    const switchFullscreen = (direction) => {
        setFullscreenSide(prev => {
            if (direction === 'left' || direction === 'right') {
                if (prev === direction) {
                    return direction === 'left' ? 'right' : 'left';
                }
                return direction;
            }

            return prev === 'left' ? 'right' : 'left';
        });
    };
    const makeNavigation = () => ({
        onPrev: () => setSelectedIdx(prev => Math.max(0, prev - 1)),
        onNext: () => setSelectedIdx(prev => Math.min(frames.length - 1, prev + 1)),
    });

    return (
        <div className="comparison">
            <FrameBox />
            <div className="comparison-container">
                {displayMode === "frames" ? (
                    <>
                        <ImageBlock
                            selectedIdx={selectedIdx}
                            navigation={makeNavigation()}
                            fullscreen={{
                                is: fullscreenSide === "left",
                                onOpen: () => setFullscreenSide("left"),
                                onClose: () => setFullscreenSide(null),
                                onSwitch: switchFullscreen,
                            }}
                        />

                        <ImageBlock
                            isConst={false}
                            selectedIdx={selectedIdx}
                            navigation={makeNavigation()}
                            fullscreen={{
                                is: fullscreenSide === "right",
                                onOpen: () => setFullscreenSide("right"),
                                onClose: () => setFullscreenSide(null),
                                onSwitch: switchFullscreen,
                            }}
                        />
                    </>) : (
                    <>
                    <VideoPlayerForAnalysis
                        videoId={originalVideoId}
                    />
                    <VideoPlayerForAnalysis
                        videoId={videoId} 
                    />
                    </>
                    )}
            </div>
        </div>
    );
};

export default Comparison;
