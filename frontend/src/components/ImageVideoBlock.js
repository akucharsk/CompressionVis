import { useEffect } from "react";
import { useDisplayMode } from "../context/DisplayModeContext";
import { apiUrl } from "../utils/urls";
import { useFrames } from "../context/FramesContext";
import { useVideoPlaying } from "../context/VideoPlayingContext";
import { useFps } from "../context/FpsContext";
import Frame from "./frameDistribution/Frame";
import Spinner from "./Spinner";
import Video from "./frameDistribution/Video";

const ImageVideoBlock = ({ isConst, videoId, videoRef, fullscreenHandler, showGrid, visibleCategories, selectedBlock, setSelectedBlock, setNextImageUrl, setPrevImageUrl, mode, macroblocks, showPast, showFuture, }) => {
    const { displayMode } = useDisplayMode();
    const { frames, framesQuery, selectedIdx, setSelectedIdx } = useFrames();
    const { isVideoPlaying } = useVideoPlaying();
    const { fps } = useFps();

    const videoUrl = `${apiUrl}/video/${videoId}`;

    useEffect(() => {
        const video = videoRef.current;
        if (!video || displayMode === "frames" || !isVideoPlaying) {
            return;
        }
        video.playbackRate = fps / 30;
        video.play().catch(() => {});
    }, [fps, videoRef, frames, selectedIdx, displayMode, isVideoPlaying]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video || displayMode === "frames" || !isVideoPlaying) {
            return;
        }
        video.currentTime = frames[selectedIdx].pts_time;
    }, [videoRef, frames, displayMode, isVideoPlaying]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video || displayMode === "video" || isVideoPlaying) return;
        console.log("Setting current time");
        video.currentTime = frames[selectedIdx].pts_time;
    }, [selectedIdx, videoRef, frames, displayMode, isVideoPlaying]);

    useEffect(() => {
        const video = videoRef.current;

        if (!video || displayMode === "video" || isVideoPlaying) return;
        video.pause();
        const currentTime = video.currentTime;
        let closestIdx = 0;

        for (let i = 0; i < frames.length; i++) {
            const nextTime = frames[i + 1]?.pts_time ?? Infinity;
            if (currentTime >= frames[i].pts_time && currentTime < nextTime) {
                closestIdx = i;
                break;
            }
        }

        setSelectedIdx(prev => (prev !== closestIdx ? closestIdx : prev));

    }, [isVideoPlaying, videoRef, fps, frames, setSelectedIdx, displayMode]);

    useEffect(() => {
        const video = videoRef.current;

        if (!video) return;
        video.playbackRate = fps / 30;

    }, [fps, videoRef])

    useEffect(() => {
        const video = videoRef.current;
        if (!video || !frames.length || !isVideoPlaying || displayMode === "frmaes") return;

        const handleTimeUpdate = () => {
            const currentTime = video.currentTime;
            let closestIdx = 0;
            for (let i = 0; i < frames.length; i++) {
                const nextTime = frames[i + 1]?.pts_time ?? Infinity;
                if (currentTime >= frames[i].pts_time && currentTime < nextTime) {
                    closestIdx = i;
                    break;
                }
            }
            setSelectedIdx(prev => (prev !== closestIdx ? closestIdx : prev));
        };

        video.addEventListener("timeupdate", handleTimeUpdate);
        return () => video.removeEventListener("timeupdate", handleTimeUpdate);
    }, [frames, isVideoPlaying, videoRef, setSelectedIdx, displayMode]);

    if (framesQuery.isPending) {
        return (
            <div className="loading-overlay">
                <Spinner />
            </div>
        );
    }

    return (
        <>
            {displayMode === "frames" ? (
                <Frame
                    fullscreenHandler={fullscreenHandler}
                    showGrid={showGrid}
                    visibleCategories={visibleCategories}
                    selectedBlock={selectedBlock}
                    setSelectedBlock={setSelectedBlock}
                    setNextImageUrl={setNextImageUrl}
                    setPrevImageUrl={setPrevImageUrl}
                    mode={mode}
                    macroblocks={macroblocks}
                    videoId={videoId}
                    showPast={showPast}
                    showFuture={showFuture}
                />
            ) : displayMode === "video" ? (
                <Video 
                    videoRef={videoRef}
                    videoUrl={videoUrl}
                />
            ) : (<div className="spinner"></div>)}
        </>
    )
}

export default ImageVideoBlock;