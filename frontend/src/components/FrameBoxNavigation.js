import { useDisplayMode } from "../context/DisplayModeContext";
import { useFrames } from "../context/FramesContext";
import { useVideoPlaying } from "../context/VideoPlayingContext";

const FrameBoxNavigation = () => {
    const { frames, setSelectedIdx } = useFrames();
    const { isVideoPlaying, setIsVideoPlaying } = useVideoPlaying();
    const { setDisplayMode } = useDisplayMode();

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

    return (
        <div className="timeline-controls">
            <button className="scroll-button left" onClick={handleMinusTen}>
                -10
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
            <button className="scroll-button right" onClick={handlePlusTen}>
                +10
            </button>
        </div>
    )
}

export default FrameBoxNavigation;