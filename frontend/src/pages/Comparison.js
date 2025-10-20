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

    const { frameMetrics, videoMetrics } = useMetrics();

    useEffect(() => {
        fetchImagesForComparison();
    }, [videoId, selectedIdx]);

    console.log({ leftRef, rightRef })

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
                        details={videoMetrics.data?.metrics || {}}
                    />
                    <ImageDetails
                        type={"Frame metrics"}
                        details={frameMetrics.data?.metrics?.[selectedIdx] || {}}
                    />
                </div>
            </div>
        </div>
    );
};

export default Comparison;
