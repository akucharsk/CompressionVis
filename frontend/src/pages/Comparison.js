import FrameBox from "../components/FrameBox";
import {useEffect, useRef, useState} from "react";
import ImageBlockConst from "../components/comparison/ImageBlockConst";
import ImageBlockSelect from "../components/comparison/ImageBlockSelect";
import ImageDetails from "../components/comparison/ImageDetails";
import './../styles/pages/Comparison.css';

// temporary imports, hardcoded
import { metricsImageInfo } from "./data/Metrics";
import {useFrames} from "../context/FramesContext";
import Frame from "../components/frameDistribution/Frame";
import {apiUrl} from "../utils/urls";
import {useSearchParams} from "react-router-dom";
import {fetchImage} from "../api/fetchImage";
import {MAX_RETRIES} from "../utils/constants";

const Comparison = () => {
    const url = 'https://www.w3schools.com/w3css/img_lights.jpg';

    const [selectedType, setSelectedType] = useState("H.265");
    const {frames, selectedIdx, setSelectedIdx} = useFrames();
    const [originalFrames, setOriginalFrames] = useState([]);
    const [params] = useSearchParams();
    const [videoMetrics, setVideoMetrics] = useState({});
    const [frameMetrics, setFrameMetrics] = useState({});
    const [originalFrameUrl, setOriginalFrameUrl] = useState("");

    const videoId = parseInt(params.get("videoId"));
    const getFrameImageUrl = (a, b) => `http://localhost:8000/${a}/${b}/`;

    // useEffect(() => {
    //     fetch(`${apiUrl}/metrics/${filename}/`)
    //         .then(res => res.json())
    //         .then(data => {
    //             setVideoMetrics(data["videoMetrics"]);
    //         })
    //         .catch(error => console.log(error))
    // }, [filename]);
    //
    // useEffect(() => {
    //     fetch(`${apiUrl}/metrics/frame/${filename}/${selectedIdx}`)
    //         .then(res => res.json())
    //         .then(data => setFrameMetrics(data))
    //         .catch(error => console.log(error))
    // }, [filename, selectedIdx]);
    //
    // useEffect(() => {
    //     setOriginalFrameUrl(`${apiUrl}/frames/${filename}/frame_${selectedIdx}.png?original=true`);
    // }, [selectedIdx, filename]);
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
            .catch(console.error);

        fetchImage(
            MAX_RETRIES,
            `${apiUrl}/frames/${videoId}/${selectedIdx}/?original=true`,
            controller
        )
            .then(url => {
                if (leftRef.current)
                    leftRef.current.src = url;
            })
            .catch(console.error);

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
