import { useEffect, useState } from "react";
import { useSettings } from "../../context/SettingsContext";
import { useSearchParams } from "react-router-dom";
import { getVideoIdsFromCache } from "../../utils/videoIdsCache";
import { fetchImage } from "../../api/fetchImage";
import { MAX_RETRIES } from "../../utils/constants";
import { apiUrl } from "../../utils/urls";
import { useVideoPlaying } from "../../context/VideoPlayingContext";
import { useDisplayMode } from "../../context/DisplayModeContext";
import { useError } from "../../context/ErrorContext";

export function useFetchingImage(isConst, selectedIdx) {
    const { parameters } = useSettings();
    const { showError } = useError();
    const originalVideoId = parameters.videoId;
    const [params] = useSearchParams();
    const videoId = parseInt(params.get("videoId"));
    const [imgSrc, setImgSrc] = useState(null);
    const {isVideoPlaying} = useVideoPlaying();
    const {setDisplayMode} = useDisplayMode();

    const compressed = getVideoIdsFromCache(originalVideoId);
    const compressedIds = compressed.filter(id => id !== videoId);

    const fetchImagesForComparison = async (original, id = null, controller = null) => {
        console.log("LOOOL")
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

        console.log(12345678)
        const controller = new AbortController();
        const currentIdx = selectedIdx;
        let cancelled = false;

        const loadImage = async () => {
            try {
                const imageUrl = await fetchImagesForComparison(!isConst, null, controller);

                if (!cancelled && currentIdx === selectedIdx) {
                    setImgSrc(imageUrl);
                    if (!isVideoPlaying) {
                        setDisplayMode("frames");
                    }
                }
            } catch (error) {
                if (error.name === "AbortError") return;
                showError(error.message, error.statusCode);
            }
        };

        loadImage();

        return () => {
            cancelled = true;
            controller.abort();
        };
    }, [selectedIdx, isConst, videoId]);

    return { imgSrc, compressedIds, fetchImagesForComparison };
}
