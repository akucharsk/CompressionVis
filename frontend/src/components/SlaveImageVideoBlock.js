// Ist WAY

import { useState, useEffect, useRef, useCallback } from "react";
import { useDisplayMode } from "../context/DisplayModeContext";
import { useSearchParams } from "react-router-dom";
import { useError } from "../context/ErrorContext";
import { apiUrl } from "../utils/urls";
import { useFrames } from "../context/FramesContext";
import { useVideoPlaying } from "../context/VideoPlayingContext";
import { useFps } from "../context/FpsContext";
import Frame from "./frameDistribution/Frame";
import Spinner from "./Spinner";
import { fetchImage } from "../api/fetchImage";
import { MAX_RETRIES } from "../utils/constants";
import Video from "./frameDistribution/Video";

const SlaveImageVideoBlock = ({ isConst, videoId, videoRef, fullscreenHandler }) => {
    const { displayMode, setDisplayMode } = useDisplayMode();
    const { frames, framesQuery, selectedIdx, setSelectedIdx } = useFrames();
    // const [ params ] = useSearchParams();
    const { isVideoPlaying, setIsVideoPlaying } = useVideoPlaying();
    const { fps } = useFps();
    const { showError } = useError();

    // const videoRef = useRef(null);

    const [imageUrl, setImageUrl] = useState(null);

    // const videoId = parseInt(params.get("videoId"));
    const videoUrl = `${apiUrl}/video/${videoId}`;

    const frameRequestPath = isConst ? `${apiUrl}/frames/${videoId}/${selectedIdx}/?original=true` : `${apiUrl}/frames/${videoId}/${selectedIdx}/`
    console.log(frameRequestPath);

    useEffect(() => {

    }, [])

    useEffect(() => {
        if (selectedIdx === null) {
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

    }, [isVideoPlaying, videoRef.current])

    useEffect(() => {
        const video = videoRef.current;
        if (!video)
            return;
        if (!isVideoPlaying) {
            video.currentTime=frames[selectedIdx].pts_time;
        }
    
    }, [selectedIdx, videoRef.current, isVideoPlaying, frames])

    useEffect(() => {
        const video = videoRef.current;

        if (!video) return;
        video.playbackRate = fps / 30;

    }, [fps, videoRef.current])

    if (framesQuery.isPending) {
        return (
            <div className="loading-overlay">
                <Spinner />
            </div>
        );
    }

    // console.log(videoId);

    return (
        <div className="left-section slave">
            {displayMode === "frames" ? (
                <Frame
                    imageUrl={imageUrl}
                    fullscreenHandler={fullscreenHandler}
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