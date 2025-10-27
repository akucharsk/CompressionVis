import { useEffect, useState } from "react";
import { useSettings } from "../../context/SettingsContext";
import { useSearchParams } from "react-router-dom";
import { getVideoIdsFromCache } from "../../utils/videoIdsCache";
import { fetchImage } from "../../api/fetchImage";
import { MAX_RETRIES } from "../../utils/constants";
import { apiUrl } from "../../utils/urls";

export function useComparisonImage(isConst, selectedIdx) {
    const { parameters } = useSettings();
    const originalVideoId = parameters.videoId;
    const [params] = useSearchParams();
    const videoId = parseInt(params.get("videoId"));
    const [imgSrc, setImgSrc] = useState(null);

    const compressed = getVideoIdsFromCache(originalVideoId);
    const compressedIds = compressed.filter(id => id !== videoId);

    const fetchImagesForComparison = async (original, id = null) => {
        const vId = id ?? videoId;
        const url = `${apiUrl}/frames/${vId}/${selectedIdx}/` + (original ? "?original=true" : "");
        const imageUrl = await fetchImage(MAX_RETRIES, url);
        setImgSrc(imageUrl);
    };

    useEffect(() => {
        fetchImagesForComparison(!isConst, null);
    }, [selectedIdx]);

    return { imgSrc, compressedIds, fetchImagesForComparison };
}
