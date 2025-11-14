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
        </>
    )
}

export default PlayCompressedVideoNav;