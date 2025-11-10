// import { useEffect, useState } from "react";
// import { useSettings } from "../../context/SettingsContext";
// import { useSearchParams } from "react-router-dom";
// import { getVideoIdsFromCache } from "../../utils/videoIdsCache";
// import { fetchImage } from "../../api/fetchImage";
// import { MAX_RETRIES } from "../../utils/constants";
// import { apiUrl } from "../../utils/urls";
// import { useVideoPlaying } from "../../context/VideoPlayingContext";
// import { useDisplayMode } from "../../context/DisplayModeContext";

// export function useImage(isConst, selectedIdx) {
//     const { isVideoPlaying, setIsVideoPlaying } = useVideoPlaying();
//     const { displayMode, setDisplayMode } = useDisplayMode();
//     const { parameters } = useSettings();
//     const originalVideoId = parameters.videoId;
//     const [params] = useSearchParams();
//     const videoId = parseInt(params.get("videoId"));
//     const [imgSrc, setImgSrc] = useState(null);

//     const compressed = getVideoIdsFromCache(originalVideoId);
//     const compressedIds = compressed.filter(id => id !== videoId);

//     // if (selectedIdx === null) {
//     //         setImageUrl(null);
//     //         return;
//     //     }

//     //     const controller = new AbortController();
//     //     let isMounted = true;

//     //     const loadImage = async () => {

//     //         try {
//     //             const url = await fetchImage(
//     //                 MAX_RETRIES,
//     //                 frameRequestPath,
//     //                 controller
//     //             );
//     //             if (isMounted) {
//     //                 setImageUrl(url);
//     //                 if (!isVideoPlaying) {
//     //                     setDisplayMode("frames");
//     //                 }
//     //             }
//     //         } catch (error) {
//     //             if (error.name === "AbortError") return;
//     //             if (isMounted) showError(error.message, error.statusCode);
//     //         }
//     //     };

//     //     loadImage();

//     //     return () => {
//     //         controller.abort();
//     //         isMounted = false;
//     //     };

//     const fetchImages = async (original, id = null) => {
//         if (seelctedIdx === null) {
//             setImgSrc(null);
//             return;
//         } 

//         const controller = new AbortController();
//         let isMounted = true;

//         const loadImage = async () => {

//             try {
//                 const vId = id ?? videoId;
//                 const url = `${apiUrl}/frames/${vId}/${selectedIdx}/` + (original ? "?original=true" : "");
//                 const imageUrl = await fetchImage(
//                     MAX_RETRIES,
//                     url,
//                     controller
//                 );
//                 if (isMounted) {
//                     setImgSrc(imageUrl);
//                     if (!isVideoPlaying) {
//                         setDisplayMode("frames");
//                     }
//                 }
//             } catch (error) {
//                 if (error.name === "AbortError") return;
//                 if (isMounted) showError(error.message, error.statusCode);
//             }
//         }

//         loadImage();
//     };

//     useEffect(() => {
//         fetchImages(!isConst, null);
//     }, [selectedIdx]);

//     return { imgSrc, compressedIds, fetchImagesForComparison: fetchImages };
// }


import { useEffect, useState } from "react";
import { useSettings } from "../../context/SettingsContext";
import { useSearchParams } from "react-router-dom";
import { getVideoIdsFromCache } from "../../utils/videoIdsCache";
import { fetchImage } from "../../api/fetchImage";
import { MAX_RETRIES } from "../../utils/constants";
import { apiUrl } from "../../utils/urls";
import { useVideoPlaying } from "../../context/VideoPlayingContext";
import { useDisplayMode } from "../../context/DisplayModeContext";

export function useComparisonImage(isConst, selectedIdx) {
    const { parameters } = useSettings();
    const originalVideoId = parameters.videoId;
    const [params] = useSearchParams();
    const videoId = parseInt(params.get("videoId"));
    const [imgSrc, setImgSrc] = useState(null);
    const {isVideoPlaying} = useVideoPlaying();
    const {setDisplayMode} = useDisplayMode();

    const compressed = getVideoIdsFromCache(originalVideoId);
    const compressedIds = compressed.filter(id => id !== videoId);

    // To jest ta sama funkcja, co wcześniej
    const fetchImagesForComparison = async (original, id = null, controller = null) => {
        const vId = id ?? videoId;
        const url = `${apiUrl}/frames/${vId}/${selectedIdx}/` + (original ? "?original=true" : "");

        const imageUrl = await fetchImage(MAX_RETRIES, url, controller);
        return imageUrl;
    };

    useEffect(() => {
        if (selectedIdx == null) {
            setImgSrc(null);
            return;
        }

        const controller = new AbortController();
        const currentIdx = selectedIdx; // snapshot bieżącego indeksu
        let cancelled = false;

        const loadImage = async () => {
            try {
                const imageUrl = await fetchImagesForComparison(!isConst, null, controller);
                // Upewnij się, że obraz nie jest z przestarzałego fetcha
                if (!cancelled && currentIdx === selectedIdx) {
                    setImgSrc(imageUrl);
                    if (!isVideoPlaying) {
                        setDisplayMode("frames");
                    }
                }
            } catch (error) {
                // Ignorujemy abort
                if (error.name === "AbortError") return;
                console.error("Image fetch failed:", error);
            }
        };

        loadImage();

        // Cleanup – anuluj fetch, jeśli zmieni się klatka
        return () => {
            cancelled = true;
            controller.abort();
        };
    }, [selectedIdx, isConst, videoId]);

    return { imgSrc, compressedIds, fetchImagesForComparison };
}
