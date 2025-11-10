import FrameBox from "../components/FrameBox";
import {useEffect, useRef, useState} from "react";
import './../styles/pages/Comparison.css';

import {useFrames} from "../context/FramesContext";
import {useSearchParams} from "react-router-dom";
import { useDisplayMode } from "../context/DisplayModeContext";
import VideoPlayerForAnalysis from "../components/frameDistribution/VideoPlayerForAnalysis";
import "../styles/pages/Comparison.css";
import ImageBlock from "../components/comparison/ImageBlock";
import { useVideoPlaying } from "../context/VideoPlayingContext";

const Comparison = () => {
    const { displayMode } = useDisplayMode();
    const { isVideoPlaying } = useVideoPlaying();

    const [params] = useSearchParams();

    const videoId = params.get("videoId");
    const originalVideoId = params.get("originalVideoId");
    const { selectedIdx, setSelectedIdx, frames } = useFrames();
    const [fullscreenSide, setFullscreenSide] = useState(null);

    const leftVdieoRef = useRef(null);
    const rightVideoRef = useRef(null);

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

    useEffect(() => {
        const leftVideo = leftVdieoRef.current;
        const rightVideo = rightVideoRef.current;
        if (!leftVideo || !rightVideo)
            return;
        if (isVideoPlaying) {
            leftVideo.currentTime = frames[selectedIdx].pts_time;
            rightVideo.currentTime = frames[selectedIdx].pts_time;
        }
    
    }, [selectedIdx, leftVdieoRef.current, rightVideoRef.current, isVideoPlaying, frames])

    return (
        <div className="comparison">
            <FrameBox />
            <div className="comparison-container">
                {/* {displayMode === "frames" ? (
                    <>
                        <ImageBlock
                            isConst={false}
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
                            videoId={videoId}
                            videoRef={leftVdieoRef}
                        />
                        <VideoPlayerForAnalysis
                            videoId={originalVideoId} 
                            videoRef={rightVideoRef}
                        />
                    </>
                    )} */}
                        <ImageBlock
                            selectedIdx={selectedIdx}
                            navigation={makeNavigation()}
                            fullscreen={{
                                is: fullscreenSide === "left",
                                onOpen: () => setFullscreenSide("left"),
                                onClose: () => setFullscreenSide(null),
                                onSwitch: switchFullscreen,
                            }}
                            videoRef={leftVdieoRef}
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
                            videoRef={rightVideoRef}
                        />
                        {/* <VideoPlayerForAnalysis
                            videoId={videoId}
                            videoRef={leftVdieoRef}
                        />
                        <VideoPlayerForAnalysis
                            videoId={originalVideoId} 
                            videoRef={rightVideoRef}
                        /> */}
            </div>
        </div>
    );
};

export default Comparison;
