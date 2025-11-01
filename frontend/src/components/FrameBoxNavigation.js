import { useEffect } from "react";
import { useDisplayMode } from "../context/DisplayModeContext";
import { useFps } from "../context/FpsContext";
import { useFrames } from "../context/FramesContext";
import { useVideoPlaying } from "../context/VideoPlayingContext";

const FrameBoxNavigation = () => {
    const { frames, selectedIdx, setSelectedIdx } = useFrames();
    const { isVideoPlaying, setIsVideoPlaying } = useVideoPlaying();
    const { setDisplayMode } = useDisplayMode();
    const { fps, setFps } = useFps();

    const handleScrollLeft = () => {
        setDisplayMode("frames");
        setSelectedIdx(prev => Math.max(0, prev - 1));
    };

    const handleScrollRight = () => {
        setDisplayMode("frames");

        setSelectedIdx(prev => Math.min(frames.length - 1, prev + 1));
    };

    const handleMinusTen = () => {
        setDisplayMode("frames");
        setSelectedIdx(prev => Math.max(0, prev - 10));
    };

    const handlePlusTen = () => {
        setDisplayMode("frames");
        setSelectedIdx(prev => Math.min(frames.length - 1, prev + 10));
    };

    useEffect(() => {
        const min = 6;
        const max = 30;
        const percent = ((fps - min) / (max - min)) * 100;
        document.documentElement.style.setProperty("--percent", `${percent}%`);
    }, [fps]);


    return (
        <div className="timeline-header">
            <div></div>
            <div className="timeline-controls">
                <button className="scroll-button-mini left" onClick={handleMinusTen}>
                    <div>&lt;&lt;</div>
                    <h6>-10</h6>
                </button>
                <button className="scroll-button left" onClick={handleScrollLeft}>
                    &lt;
                </button>
                {isVideoPlaying ? 
                    <button 
                        className="play-button playing"
                        onClick={() => {
                            setIsVideoPlaying(false);
                        }}    
                    > 
                    ⏹
                    </button>
                : !isVideoPlaying && selectedIdx == frames.length - 1 ?  
                    <button 
                        className="play-button "
                        onClick={() => {
                            setSelectedIdx(0);
                        }}
                    >
                    ⟳
                    </button> :    
                    <button 
                        className="play-button "
                        onClick={() => {
                            setIsVideoPlaying(true);
                            setDisplayMode("video");
                        }}
                    >
                    ▶
                    </button>}
                <button className="scroll-button right" onClick={handleScrollRight}>
                    &gt;
                </button>
                <button className="scroll-button-mini right " onClick={handlePlusTen}>
                    <div>&gt;&gt;</div>
                    <h6>+10</h6>
                </button>
            </div>
            <div className="timeline-rightbar">
                <div className="frame-counter">
                    {selectedIdx + 1} / {frames.length}
                </div>
                <div className="speed-control">
                    <div className="speed-description">
                        <label>Speed: </label>
                        <div className="speed-value"> {fps} FPS</div>
                    </div>
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
                    </div>
                </div>
            </div>
        </div>
    )
}

export default FrameBoxNavigation;