import { useEffect } from "react";
import { useDisplayMode } from "../context/DisplayModeContext";
import { apiUrl } from "../utils/urls";
import { useFrames } from "../context/FramesContext";
import { useVideoPlaying } from "../context/VideoPlayingContext";
import { useFps } from "../context/FpsContext";
import Frame from "./frameDistribution/Frame";
import Spinner from "./Spinner";
import Video from "./frameDistribution/Video";

const SlaveImageVideoBlock = ({ isConst, videoId, videoRef, fullscreenHandler, imgSrc }) => {
    const { displayMode } = useDisplayMode();
    const { frames, framesQuery, selectedIdx } = useFrames();
    const { isVideoPlaying } = useVideoPlaying();
    const { fps } = useFps();

    const videoUrl = `${apiUrl}/video/${videoId}`;

    useEffect(() => {
        const video = videoRef.current;
        
        if (!video) return;

        if (isVideoPlaying) {
            video.play().catch(() => {});
        }
        else {
            video.pause();
        }

    }, [isVideoPlaying, videoRef, fps, frames])

    useEffect(() => {
        const video = videoRef.current;
        if (!video || displayMode === "frames" || !isVideoPlaying) {
            return;
        }
        video.currentTime = frames[selectedIdx].pts_time;
    }, [videoRef, frames, displayMode, isVideoPlaying]);

    useEffect(() => {
        const video = videoRef.current;

        if (!video) return;
        video.playbackRate = fps / 30;

    }, [fps, videoRef])

    if (framesQuery.isPending) {
        return (
            <div className="loading-overlay">
                <Spinner />
            </div>
        );
    }

    return (
        <div className="slave">
            {displayMode === "frames" ? (
                <Frame
                    fullscreenHandler={fullscreenHandler}
                    macroblocks={false}
                    videoId={videoId}
                />
            ) : displayMode === "video" ? (
                <Video 
                    videoRef={videoRef}
                    videoUrl={videoUrl}
                />
            ) : (<div className="spinner"></div>)}
        </div>
    )
}

export default SlaveImageVideoBlock;