import { useEffect, useState } from "react";
import { fetchImage } from "../../api/fetchImage";
import { MAX_RETRIES } from "../../utils/constants";
import { apiUrl } from "../../utils/urls";
import { useSearchParams } from "react-router-dom";

export function useAdjacentFrames(currentFrameIdx, selectedBlock, frames) {
    const [prevUrl, setPrevUrl] = useState(null);
    const [nextUrl, setNextUrl] = useState(null);
    const [params] = useSearchParams();
    const videoId = parseInt(params.get("videoId"));

    useEffect(() => {
        setPrevUrl(null);
        setNextUrl(null);

        if (!selectedBlock || !videoId || !frames || frames.length === 0) return;

        const sources = [selectedBlock.source, selectedBlock.source2]
            .filter(v => typeof v === "number" && v !== 0);

        if (sources.length === 0) return;

        const findReferenceFrameIndex = (startIdx, offset) => {
            const direction = offset < 0 ? -1 : 1;
            const targetCount = Math.abs(offset);
            let foundCount = 0;

            let i = startIdx + direction;

            while (i >= 0 && i < frames.length) {
                const frame = frames[i];

                if (frame.type === 'I' || frame.type === 'P') {
                    foundCount++;
                    if (foundCount === targetCount) {
                        return i;
                    }
                }

                i += direction;
            }

            return null;
        };

        const fetchAdjacent = async () => {
            const framePromises = sources.map(async (offset) => {
                const targetArrayIdx = findReferenceFrameIndex(currentFrameIdx, offset);

                if (targetArrayIdx === null) return null;

                const targetFrameNumber = frames[targetArrayIdx].frame_number;

                const url = await fetchImage(
                    MAX_RETRIES,
                    `${apiUrl}/frames/${videoId}/${targetFrameNumber}/`
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
    }, [selectedBlock, videoId, currentFrameIdx, frames]);

    return { prevUrl, nextUrl };
}