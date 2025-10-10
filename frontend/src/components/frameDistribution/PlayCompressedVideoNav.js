const PlayCompressedVideoNav = ({isPlaying, setIsPlaying}) => {
    return (
        <>
            <button
                className={`play-button `}
                onClick={() => {}}
            >
                ⏮
            </button>
            <button
                className={`play-button ${isPlaying ? 'playing' : ''}`}
                onClick={() => setIsPlaying(prev => !prev)}
            >
                {isPlaying ? '⏹ Stop' : '▶ Play'}
            </button>
            <button
                className={`play-button `}
                onClick={() => {}}
            >
                ⏭
            </button>
            <div className="speed-control">
                <label>Speed:</label>
                <div className="speed-slider-container">
                    <input
                        type="range"
                        min="1"
                        max="15"
                        step="1"
                        value={fps}
                        onChange={(e) => setFps(Number(e.target.value))}
                        className="speed-slider"
                    />
                    <div className="speed-value">{fps} FPS</div>

                </div>
            </div>
        </>
    )
}

export default PlayCompressedVideoNav;