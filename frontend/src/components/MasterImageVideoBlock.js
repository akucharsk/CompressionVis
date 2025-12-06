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

const MasterImageVideoBlock = ({ isConst, videoId, videoRef, videoSlaveRef, fullscreenHandler, imgSrc }) => {
    console.log(videoSlaveRef.current);
    const { displayMode, setDisplayMode } = useDisplayMode();
    const { frames, framesQuery, selectedIdx, setSelectedIdx } = useFrames();
    // const [ params ] = useSearchParams();
    const { isVideoPlaying } = useVideoPlaying();
    const { fps } = useFps();

    const videoUrl = `${apiUrl}/video/${videoId}`;


    useEffect(() => {
        const video = videoRef.current;
        const videoSlave = videoSlaveRef.current;
        
        if (!video || !videoSlave) return;

        if (isVideoPlaying) {
            const fpsRate = fps / 30;
            const currentTimeFromList = frames[selectedIdx].pts_time;

            video.playbackRate = fpsRate;
            videoSlave.playbackRate = fpsRate;
            video.currentTime = currentTimeFromList;
            videoSlave.currentTime = currentTimeFromList;
            video.play().catch(() => {});
            videoSlave.play().catch(() => {});
        }
        else {
            video.pause();
            videoSlave.pause();
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
        }

    }, [isVideoPlaying, videoRef.current])

    useEffect(() => {
        const video = videoRef.current;
        const videoSlave = videoSlaveRef.current;

        if (!video || !videoSlave)
            return;
        if (!isVideoPlaying) {
            video.currentTime=frames[selectedIdx].pts_time;
            videoSlave.currentTime=frames[selectedIdx].pts_time;
        }
    
    }, [selectedIdx, videoRef.current, isVideoPlaying, frames])

    useEffect(() => {
        const video = videoRef.current;
        const videoSlave = videoSlaveRef.current;

        if (!video || !videoSlave) return;
        video.playbackRate = fps / 30;
        videoSlave.playbackRate = fps / 30;

    }, [fps, videoRef.current])

    useEffect(() => {
        const video = videoRef.current;
        if (!video || !frames.length) return;

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
    }, [frames, isVideoPlaying, videoRef.current]);


    if (framesQuery.isPending) {
        return (
            <div className="loading-overlay">
                <Spinner />
            </div>
        );
    }



    // console.log(videoId);

    return (
        <div className="left-section">
            {displayMode === "frames" ? (
                <Frame
                    imageUrl={imgSrc}
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

export default MasterImageVideoBlock;