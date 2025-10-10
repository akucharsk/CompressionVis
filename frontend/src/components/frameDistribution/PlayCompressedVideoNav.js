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
        </>
    )
}

export default PlayCompressedVideoNav;