import FrameBox from "../components/FrameBox";
import {useEffect, useRef, useState} from "react";
import ImageBlockConst from "../components/comparison/ImageBlockConst";
import ImageBlockSelect from "../components/comparison/ImageBlockSelect";
import ImageDetails from "../components/comparison/ImageDetails";
import './../styles/pages/Comparison.css';

import {useFrames} from "../context/FramesContext";
import {apiUrl} from "../utils/urls";
import {useSearchParams} from "react-router-dom";
import {fetchImage} from "../api/fetchImage";
import {MAX_RETRIES} from "../utils/constants";
import {handleError} from "../utils/handlers";

const Comparison = () => {
    const [selectedType, setSelectedType] = useState("H.265");
    const { selectedIdx } = useFrames();
    const [params] = useSearchParams();
    const [videoMetrics, setVideoMetrics] = useState({});
    const [frameMetrics, setFrameMetrics] = useState({});

    const videoId = parseInt(params.get("videoId"));

    useEffect(() => {
        const controller = new AbortController();
        fetch(`${apiUrl}/metrics/${videoId}`, { signal: controller.signal })
            .then(res => res.json())
            .then(data => setVideoMetrics(data["videoMetrics"]))
            .catch(handleError);

        return () => controller.abort();
    }, [videoId]);

    useEffect(() => {
        const controller = new AbortController();
        fetch(`${apiUrl}/metrics/frame/${videoId}/${selectedIdx}`, { signal: controller.signal })
            .then(res => res.json())
            .then(setFrameMetrics)
            .catch(handleError);
    }, [videoId, selectedIdx, videoMetrics]);

    const leftRef = useRef(null);
    const rightRef = useRef(null);

    useEffect(() => {
        const controller = new AbortController();
        fetchImage(
            MAX_RETRIES,
            `${apiUrl}/frames/${videoId}/${selectedIdx}/`,
            controller
        )
            .then(url => {
                if (rightRef.current)
                    rightRef.current.src = url;
            })
            .catch(handleError);

        fetchImage(
            MAX_RETRIES,
            `${apiUrl}/frames/${videoId}/${selectedIdx}/?original=true`,
            controller
        )
            .then(url => {
                if (leftRef.current)
                    leftRef.current.src = url;
            })
            .catch(handleError);

        return () => controller.abort();
    }, [videoId, selectedIdx]);

    return (
        <div className="comparison">
            <FrameBox/>
            <div className="comparison-container">
                <ImageBlockConst
                    type={"Original"}
                    ref={leftRef}
                />
                <ImageBlockSelect 
                    types={["H.264"]}
                    selectedType={selectedType}
                    setSelectedType={setSelectedType}
                    ref={rightRef}
                />
            </div>
            <div className="description">
                <h1>Metrics</h1>
                <div className="comparision-details">
                    <ImageDetails
                        type={"Video metrics"}
                        details={videoMetrics}
                    />
                    {/* validation for values not assigned in metricsImageInfo. later to delete */}
                    <ImageDetails
                        type={"Frame metrics"}
                        details={frameMetrics}
                    />
                </div>
            </div>
        </div>
    );
};

export default Comparison;
