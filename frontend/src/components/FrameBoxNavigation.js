import { useFrames } from "../context/FramesContext";
import { useVideoPlaying } from "../context/VideoPlayingContext";

const FrameBoxNavigation = () => {
    const { frames, selectedIdx, setSelectedIdx } = useFrames();
    const { isVideoPlaying, setIsVideoPlaying } = useVideoPlaying();

    const handleScrollLeft = () => {
        setSelectedIdx(prev => Math.max(0, prev - 1));
    };

    const handleScrollRight = () => {
        setSelectedIdx(prev => Math.min(frames.length - 1, prev + 1));
    };

    const handleMinusTen = () => {
        setSelectedIdx(prev => Math.max(0, prev - 10));
    };

    const handlePlusTen = () => {
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
            <button
                className={`play-button ${isVideoPlaying ? 'playing' : ''}`}
                onClick={() => setIsVideoPlaying(prev => !prev)}
            >
                {isVideoPlaying ? '⏹ Stop' : '▶ Play'}
            </button>
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