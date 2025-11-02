import FrameBox from "../components/FrameBox";
import { useState } from "react";
import "../styles/pages/Comparison.css";
import { useFrames } from "../context/FramesContext";
import { useMetrics } from "../context/MetricsContext";
import ImageBlock from "../components/comparison/ImageBlock";

const Comparison = () => {
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
            </div>
        </div>
    );
};

export default Comparison;
