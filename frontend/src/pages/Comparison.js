import FrameBox from "../components/FrameBox";
import {useEffect, useState} from "react";
import ImageBlockConst from "../components/comparison/ImageBlockConst";
import ImageBlockSelect from "../components/comparison/ImageBlockSelect";
import ImageDetails from "../components/comparison/ImageDetails";
import './../styles/pages/Comparison.css';

// temporary imports, hardcoded
import { metricsImageInfo } from "./data/Metrics";
import {useFrames} from "../context/FramesContext";
import Frame from "../components/frameDistribution/Frame";
import {apiUrl, getFrameImageUrl} from "../utils/urls";
import {useSearchParams} from "react-router-dom";

const Comparison = () => {
    const url = 'https://www.w3schools.com/w3css/img_lights.jpg';

    const [selectedType, setSelectedType] = useState("H.265");
    const {frames, selectedIdx, setSelectedIdx} = useFrames();
    const [originalFrames, setOriginalFrames] = useState([]);
    const [params] = useSearchParams();
    const [videoMetrics, setVideoMetrics] = useState({});
    const [frameMetrics, setFrameMetrics] = useState({});
    const [originalFrameUrl, setOriginalFrameUrl] = useState("");

    const filename = params.get("filename");

    useEffect(() => {
        fetch(`${apiUrl}/metrics/${filename}/`)
            .then(res => res.json())
            .then(data => {
                setVideoMetrics(data["videoMetrics"]);
            })
            .catch(error => console.log(error))
    }, [filename]);

    useEffect(() => {
        fetch(`${apiUrl}/metrics/frame/${filename}/${selectedIdx}`)
            .then(res => res.json())
            .then(data => setFrameMetrics(data))
            .catch(error => console.log(error))
    }, [filename, selectedIdx]);

    useEffect(() => {
        setOriginalFrameUrl(`${apiUrl}/frames/${filename}/frame_${selectedIdx}.png?original=true`);
    }, [selectedIdx, filename]);

    return (
        <div className="comparison">
            <FrameBox/>
            <div className="comparison-container">
                <ImageBlockConst
                    url={originalFrameUrl}
                    type={"Original"}
                />
                <ImageBlockSelect 
                    url={getFrameImageUrl(selectedIdx, frames)}
                    types={["H.264"]}
                    selectedType={selectedType}
                    setSelectedType={setSelectedType}
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
