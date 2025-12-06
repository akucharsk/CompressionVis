import { useEffect, useState } from "react";

const ChartsOptions = () => {

    const [compressedVideos, setCompressedVideos] = useState([]);

    useEffect = (() => {

    }, [compressedVideos])

    return (
        <div className="charts-options-panel">
            <div className="charts-scene-threshold">
                {/* threshold */}
            </div>
            <div className="charts-compressions-select">
                <h3>Choose compressions to compare</h3>
                <div></div>
            </div>
        </div>
    )
}

export default ChartsOptions;