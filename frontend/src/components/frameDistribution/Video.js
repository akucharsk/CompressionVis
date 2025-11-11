import { useVideoPlaying } from "../../context/VideoPlayingContext";

const Video = ({ videoRef, videoUrl }) => {
    const { setIsVideoPlaying } = useVideoPlaying();

    return (
        <div className="video-preview">
            <video
                ref={videoRef}
                src={videoUrl}
                onEnded={() => {
                    setIsVideoPlaying(false);
                }}
                className="compressed-video"
            />
        </div>
    )
}

export default Video