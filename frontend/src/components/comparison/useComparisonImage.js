import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchImage } from "../../api/fetchImage";
import { MAX_RETRIES } from "../../utils/constants";
import { apiUrl } from "../../utils/urls";

export function useComparisonImage() {
    const [params] = useSearchParams();
    const videoId = parseInt(params.get("videoId"));
    const selectedIdx = parseInt(params.get("frameNumber")) || 0;
    const [imgSrc, setImgSrc] = useState(null);

    const fetchImagesForComparison = async (original, id = null, controller = null) => {
        const vId = id ?? videoId;
        const url = `${apiUrl}/frames/${vId}/${selectedIdx}/` + (original ? "?original=true" : "");
        const imageUrl = await fetchImage(MAX_RETRIES, url, controller);
        setImgSrc(imageUrl);
        return imageUrl;
    };

    return { imgSrc, fetchImagesForComparison };
}
