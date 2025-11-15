import { useEffect } from "react";
import { useDisplayMode } from "../context/DisplayModeContext";
import { apiUrl } from "../utils/urls";
import { useFrames } from "../context/FramesContext";
import { useVideoPlaying } from "../context/VideoPlayingContext";
import { useFps } from "../context/FpsContext";
import Frame from "./frameDistribution/Frame";
import Spinner from "./Spinner";
import Video from "./frameDistribution/Video";

const SlaveImageVideoBlock = ({ videoId, videoRef, fullscreenHandler, imgSrc }) => {
    const { displayMode, setDisplayMode } = useDisplayMode();
    const { frames, framesQuery, selectedIdx } = useFrames();
    const { isVideoPlaying } = useVideoPlaying();
    const { fps } = useFps();

    const videoUrl = `${apiUrl}/video/${videoId}`;

    const frameRequestPath = `${apiUrl}/frames/${videoId}/${selectedIdx}/`
    console.log(frameRequestPath);

    useEffect(() => {

    }, [])

    useEffect(() => {
        if (selectedIdx === null || isVideoPlaying) {
            setImageUrl(null);
            return;
        }

        const controller = new AbortController();
        let isMounted = true;

        const loadImage = async () => {

            try {
                const url = await fetchImage(
                    MAX_RETRIES,
                    frameRequestPath,
                    controller
                );
                if (isMounted) {
                    setImageUrl(url);
                    if (!isVideoPlaying) {
                        setDisplayMode("frames");
                    }
                }
            } catch (error) {
                if (error.name === "AbortError") return;
                if (isMounted) showError(error.message, error.statusCode);
            }
        };

        loadImage();

        return () => {
            controller.abort();
            isMounted = false;
        };
    }, [selectedIdx, videoId, frames, showError, isVideoPlaying]);

    useEffect(() => {
        const video = videoRef.current;
        
        if (!video) return;

        if (isVideoPlaying) {
            video.playbackRate = fps / 30;
            video.currentTime = frames[selectedIdx].pts_time;
            video.play().catch(() => {});
        }
        else {
            video.pause();
        }

    }, [isVideoPlaying, videoRef, fps, frames, selectedIdx])

    useEffect(() => {
        const video = videoRef.current;
        if (!video)
            return;
        if (!isVideoPlaying) {
            video.currentTime=frames[selectedIdx].pts_time;
        }
    
    }, [selectedIdx, videoRef, isVideoPlaying, frames])

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