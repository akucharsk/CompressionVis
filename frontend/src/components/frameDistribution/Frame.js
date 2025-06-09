import React, {useEffect, useRef} from "react";
import {DEFAULT_RETRY_TIMEOUT_MS, MAX_RETRIES} from "../../utils/constants";
import {useSearchParams} from "react-router-dom";
import {apiUrl} from "../../utils/urls";
import {STATUS} from "../../utils/enums/status";
import RetryLimitError from "../../exceptions/RetryLimitError";
import {fetchImage} from "../../api/fetchImage";

const Frame = ({ frames, selectedIdx }) => {

    const imageRef = useRef(null);
    const [params] = useSearchParams();
    const videoId = parseInt(params.get("videoId"));

    useEffect(() => {
        const controller = new AbortController();

        fetchImage(
            MAX_RETRIES,
            `${apiUrl}/frames/${videoId}/${selectedIdx}/`,
            controller
        )
            .then(url => {
                if (imageRef.current) {
                    imageRef.current.src = url;
                }
            })
            .catch(console.error);

        return () => controller.abort();

    }, [selectedIdx, videoId])

    return (
        <div className="left-section">
            {frames.length > 0 && selectedIdx < frames.length && (
                <div className="frame-preview">
                    <img
                        alt={`Frame ${selectedIdx} (${frames[selectedIdx].type})`}
                        ref={imageRef}
                    />
                    <div className="frame-info">
                        <p>Frame: {selectedIdx}</p>
                        <p>Type: {frames[selectedIdx].type}</p>
                        <p>Time: {frames[selectedIdx].pts_time}s</p>
                        <p>Size: {`${frames[selectedIdx].pkt_size}B`}</p>
                    </div>
                </div>
            )}
        </div>
    )
};


export default Frame;
