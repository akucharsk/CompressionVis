import { useVideoPlaying } from "../../context/VideoPlayingContext";

const PlayCompressedVideoNav = () => {
    const { isVideoPlaying, setIsVideoPlaying } = useVideoPlaying();

    return (
        <>
            <button
                className={`play-button `}
                onClick={() => {}}
            >
                ⏮
            </button>
            <button
                className={`play-button ${isVideoPlaying ? 'playing' : ''}`}
                onClick={() => setIsVideoPlaying(prev => !prev)}
            >
                {isVideoPlaying ? '⏹ Stop' : '▶ Play'}
            </button>
            <button
                className={`play-button `}
                onClick={() => {}}
            >
                ⏭
            </button>
            <button
                className={`play-button `}
                onClick={() => {}}
            >
                ⛶
            </button>
            {/* <div className="speed-control">
                <label>Speed:</label>
                <div className="speed-slider-container">
                    <input
                        type="range"
                        min="1"
                        max="15"
                        step="1"
                        value={speed}
                        onChange={(e) => setSpeed(Number(e.target.value))}
                        className="speed-slider"
                    />
                    <div className="speed-value">{speed} FPS</div>

                </div>
            </div> */}
        </>
    )
}

export default PlayCompressedVideoNav;