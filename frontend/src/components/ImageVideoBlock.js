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

const ImageVideoBlock = () => {
    const { displayMode, setDisplayMode, hasImageFetched,setHasImageFetched } = useDisplayMode();
    const { frames, framesQuery, selectedIdx, setSelectedIdx } = useFrames();
    const [ params ] = useSearchParams();
    const { isVideoPlaying, setIsVideoPlaying } = useVideoPlaying();
    const { fps } = useFps();
    const { showError } = useError();

    const videoRef = useRef(null);

    const [imageUrl, setImageUrl] = useState(null);
    const [currentFrameIdx, setCurrentFrameIdx] = useState(null);

    const videoId = parseInt(params.get("videoId"));
    const videoUrl = `${apiUrl}/video/${videoId}`;

    useEffect(() => {

    }, [])

    useEffect(() => {
        if (selectedIdx === null) {
            setImageUrl(null);
            setCurrentFrameIdx(null);
            return;
        }
        // if (isVideoPlaying) {
        //     return;
        // }

        if (selectedIdx === currentFrameIdx && imageUrl != null) {
            return;
        }

        const controller = new AbortController();
        let isMounted = true;

        const loadImage = async () => {

            try {
                setHasImageFetched(false);
                const url = await fetchImage(
                    MAX_RETRIES,
                    `${apiUrl}/frames/${videoId}/${selectedIdx}/`,
                    controller
                );
                if (isMounted) {
                    setImageUrl(url);
                    setHasImageFetched(true);
                    setCurrentFrameIdx(selectedIdx);
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
    }, [selectedIdx, videoId, frames, showError, currentFrameIdx, imageUrl, isVideoPlaying]);

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
            // setHasImageFetched(false);
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


    // setDisplayMode(null);

    if (framesQuery.isPending) {
        return (
            <div className="loading-overlay">
                <Spinner />
            </div>
        );
    }

    return (
        <div className="left-section">
            {displayMode === "frames" && hasImageFetched ? (
                <Frame
                    imageUrl={imageUrl}
                />
            ) : displayMode === "video" || (displayMode === "frames" && !hasImageFetched)? (
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
            ) : (<div className="spinner"></div>)}
        </div>
    )
}

export default ImageVideoBlock;

// //IInd way

// import { useState, useEffect, useRef, useCallback } from "react";
// import { useDisplayMode } from "../context/DisplayModeContext";
// import { useSearchParams } from "react-router-dom";
// import { useError } from "../context/ErrorContext";
// import { fetchImage } from "../api/fetchImage";
// import { apiUrl } from "../utils/urls";
// import { handleApiError } from "../utils/errorHandler";
// import { useFrames } from "../context/FramesContext";
// import { MAX_RETRIES } from "../utils/constants";
// import { useVideoPlaying } from "../context/VideoPlayingContext";
// import { useFps } from "../context/FpsContext";
// import Frame from "./frameDistribution/Frame";
// import Spinner from "./Spinner";

// const ImageVideoBlock = () => {
//     const { displayMode } = useDisplayMode();
//     const { frames, framesQuery, selectedIdx, setSelectedIdx } = useFrames();
//     const [ params ] = useSearchParams();
//     const { isVideoPlaying, setIsVideoPlaying } = useVideoPlaying();
//     const { fps } = useFps();
//     const { showError } = useError();

//     const [imageUrl, setImageUrl] = useState(null);

//     const videoRef = useRef(null);

//     const videoId = parseInt(params.get("videoId"));
//     const videoUrl = `${apiUrl}/video/${videoId}`;
//     useEffect(() => {
//         const video = videoRef.current;
        
//         if (!video) return;

//         if (isVideoPlaying) {
//             video.playbackRate = fps / 30;
//             video.currentTime = frames[selectedIdx].pts_time;
//             video.play().catch(() => {});
//         }
//         else {
//             video.pause();
//             const currentTime = video.currentTime;
//             let closestIdx = 0;

//             for (let i = 0; i < frames.length; i++) {
//                 const nextTime = frames[i + 1]?.pts_time ?? Infinity;
//                 if (currentTime >= frames[i].pts_time && currentTime < nextTime) {
//                     closestIdx = i;
//                     break;
//                 }
//             }

//             setSelectedIdx(prev => (prev !== closestIdx ? closestIdx : prev));
//         }

//     }, [isVideoPlaying, videoRef.current])

//     useEffect(() => {
//         const video = videoRef.current;
//         if (!video)
//             return;
//         if (!isVideoPlaying) {
//             video.currentTime=frames[selectedIdx].pts_time;
//         }
    
//     }, [selectedIdx, videoRef.current, isVideoPlaying, frames])

//     useEffect(() => {
//         const video = videoRef.current;

//         if (!video) return;
//         video.playbackRate = fps / 30;

//     }, [fps, videoRef.current])

//     // // Faster alternative way of following
//     useEffect(() => {
//         const video = videoRef.current;
//         if (!video || !frames.length) return;

//         let animationFrameId;

//         const updateFrame = () => {
//             const currentTime = video.currentTime;
//             let closestIdx = 0;

//             for (let i = 0; i < frames.length; i++) {
//                 const nextTime = frames[i + 1]?.pts_time ?? Infinity;
//                 if (currentTime >= frames[i].pts_time && currentTime < nextTime) {
//                     closestIdx = i;
//                     break;
//                 }
//             }

//             setSelectedIdx(prev => (prev !== closestIdx ? closestIdx : prev));

//             if (!video.paused && !video.ended) {
//                 animationFrameId = requestAnimationFrame(updateFrame);
//             }
//         };

//         if (isVideoPlaying) {
//             animationFrameId = requestAnimationFrame(updateFrame);
//         }

//         return () => cancelAnimationFrame(animationFrameId);
//     }, [videoUrl, frames, isVideoPlaying]);

//     if (framesQuery.isPending) {
//         return (
//             <div className="loading-overlay">
//                 <Spinner />
//             </div>
//         );
//     }

//     return (
//         <div className="left-section">
//             {!isVideoPlaying ? (
//                 <Frame />
//             ) : (
//                 <video
//                     ref={videoRef}
//                     src={videoUrl}
//                     onEnded={() => {
//                         setIsVideoPlaying(false);
//                     }}
//                     className="compressed-video"
//                 />
//             )}
//         </div>
//     )
// }

// export default ImageVideoBlock;