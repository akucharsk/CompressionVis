import FrameBox from "../components/FrameBox";
import { useState } from "react";
import ImageBlockConst from "../components/comparison/ImageBlockConst";
import ImageBlockSelect from "../components/comparison/ImageBlockSelect";
import ImageDetails from "../components/comparison/ImageDetails";
import './../styles/pages/Comparison.css';

// temporary imports, hardcoded
import { metricsImageInfo } from "./data/Metrics";

const Comparison = () => {
    const url = 'https://www.w3schools.com/w3css/img_lights.jpg';

    const [selectedType, setSelectedType] = useState("H.265");

    return (
        <div className="comparison">
            <FrameBox/>
            <div className="comparison-container">
                <ImageBlockConst 
                    url={url} 
                    type="H.264"
                />
                <ImageBlockSelect 
                    url={url} 
                    types={["MPEG-1", "H.265", "VP9"]}
                    selectedType={selectedType}
                    setSelectedType={setSelectedType}
                />
            </div>
            <div className="description">
                <h1>Metrics</h1>
                <div className="comparision-details">
                    <ImageDetails
                        type={"H.264"}
                        details={metricsImageInfo["H.264"]}
                    />
                    {/* validation for values not assigned in metricsImageInfo. later to delete */}
                    {metricsImageInfo[selectedType] && (
                        <ImageDetails
                            type={selectedType}
                            details={metricsImageInfo[selectedType]}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default Comparison;
