import React, {useEffect, useRef} from "react";
import {MAX_RETRIES} from "../../utils/constants";
import {useSearchParams} from "react-router-dom";
import {apiUrl} from "../../utils/urls";
import {fetchImage} from "../../api/fetchImage";
import './../../styles/components/distribution/Frame.css';

const Frame = ({ frames, selectedIdx }) => {

    const imageRef = useRef(null);
    const [params] = useSearchParams();
    const videoId = parseInt(params.get("videoId"));

    useEffect(() => {
        if (selectedIdx === null)
            return;

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

    }, [selectedIdx, videoId, frames])

    return (
        <div className="left-section">
            {frames.length > 0 && selectedIdx < frames.length && (
                <div className="frame-preview">
                    <img
                        alt={`Frame ${selectedIdx} (${frames[selectedIdx].type})`}
                        ref={imageRef}
                    />
                </div>
            )}
        </div>
    )
};

export default Frame;
