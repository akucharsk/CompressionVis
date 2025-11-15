import { useEffect, useState } from "react";
import { fetchImage } from "../../api/fetchImage";
import { MAX_RETRIES } from "../../utils/constants";
import { apiUrl } from "../../utils/urls";
import {useSearchParams} from "react-router-dom";

export function useAdjacentFrames(currentFrameIdx, selectedBlock, frames) {
    const [prevUrl, setPrevUrl] = useState(null);
    const [nextUrl, setNextUrl] = useState(null);
    const [ params ] = useSearchParams();
    const videoId = parseInt(params.get("videoId"));

    useEffect(() => {
        if (!selectedBlock || !videoId) return;

        const sources = [selectedBlock.source, selectedBlock.source2]
            .filter(v => typeof v === "number" && v !== 0);

        if (sources.length === 0) return;

        const fetchAdjacent = async () => {
            const framePromises = sources.map(async (offset) => {
                const targetIdx = currentFrameIdx + offset;
                if (targetIdx < 0 || targetIdx >= frames.length) return null;

                const url = await fetchImage(
                    MAX_RETRIES,
                    `${apiUrl}/frames/${videoId}/${targetIdx}/`
                );

                return { offset, url };
            });

            const results = (await Promise.all(framePromises)).filter(Boolean);

            const prev = results.find(r => r.offset < 0);
            const next = results.find(r => r.offset > 0);

            setPrevUrl(prev?.url || null);
            setNextUrl(next?.url || null);
        };

        fetchAdjacent();
    }, [selectedBlock, videoId, currentFrameIdx, frames.length]);

    return { prevUrl, nextUrl };
}
