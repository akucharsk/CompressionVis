import FrameBox from "../components/FrameBox";
import {useEffect, useRef, useState} from "react";
import ImageBlockConst from "../components/comparison/ImageBlockConst";
import ImageBlockSelect from "../components/comparison/ImageBlockSelect";
import ImageDetails from "../components/comparison/ImageDetails";
import './../styles/pages/Comparison.css';

import {useFrames} from "../context/FramesContext";
import {apiUrl} from "../utils/urls";
import {useMatch, useSearchParams} from "react-router-dom";
import {fetchImage} from "../api/fetchImage";
import {MAX_RETRIES} from "../utils/constants";
import Parameters from "../components/Parameters";
import { useMetrics } from "../context/MetricsContext";

const Comparison = () => {
    const [selectedType, setSelectedType] = useState("H.265");
    const { selectedIdx } = useFrames();
    const [params] = useSearchParams();

    const videoId = parseInt(params.get("videoId"));

    const leftRef = useRef(null);
    const rightRef = useRef(null);

    const fetchImagesForComparison = async () => {
        const processedImageUrl = await fetchImage(
            MAX_RETRIES,
            `${apiUrl}/frames/${videoId}/${selectedIdx}/`,
        );
        const originalImageUrl = await fetchImage(
            MAX_RETRIES,
            `${apiUrl}/frames/${videoId}/${selectedIdx}/?original=true`,
        );
        if (leftRef.current)
            leftRef.current.src = originalImageUrl;
        if (rightRef.current)
            rightRef.current.src = processedImageUrl;
    }

    const { frameMetricsQuery, videoMetricsQuery } = useMetrics();

    useEffect(() => {
        fetchImagesForComparison();
    }, [videoId, selectedIdx]);

    return (
        <div className="comparison">
            <FrameBox/>
            <div className="comparison-container">
                <ImageBlockConst
                    type={"Original"}
                    imageRef={leftRef}
                />
                <ImageBlockSelect 
                    types={["H.264"]}
                    selectedType={selectedType}
                    setSelectedType={setSelectedType}
                    imageRef={rightRef}
                />
                <div className="description">
                    <Parameters/>
                    <ImageDetails
                        type={"Video metrics"}
                        details={videoMetricsQuery.data?.metrics || {}}
                    />
                    <ImageDetails
                        type={"Frame metrics"}
                        details={frameMetricsQuery.data?.metrics?.[selectedIdx] || {}}
                    />
                </div>
            </div>
        </div>
    );
};

export default Comparison;
