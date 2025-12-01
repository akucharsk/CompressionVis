import FrameBox from "../components/FrameBox";
import {useEffect, useRef, useState} from "react";
import './../styles/pages/Comparison.css';
import {useFrames} from "../context/FramesContext";
import ImageBlock from "../components/comparison/ImageBlock";
import { useVideoPlaying } from "../context/VideoPlayingContext";

const Comparison = () => {
    const { isVideoPlaying } = useVideoPlaying();
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
    
    }, [selectedIdx, isVideoPlaying, frames]);

    return (
        <div className="comparison">
            <FrameBox />
            <div className="comparison-container">
                <ImageBlock
                    isConst={true}
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
                    navigation={makeNavigation()}
                    fullscreen={{
                        is: fullscreenSide === "right",
                        onOpen: () => setFullscreenSide("right"),
                        onClose: () => setFullscreenSide(null),
                        onSwitch: switchFullscreen,
                    }}
                    videoRef={rightVideoRef}
                />
            </div>
        </div>
    );
};

export default Comparison;
