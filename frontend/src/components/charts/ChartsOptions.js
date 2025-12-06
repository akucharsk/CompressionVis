import { useEffect, useState } from "react";

const ChartsOptions = () => {

    const [compressedVideos, setCompressedVideos] = useState([]);

    useEffect(() => {

    }, [compressedVideos])

    return (
        <div className="charts-options-panel">
            <div className="charts-scene-threshold">
                {/* threshold */}
            </div>
            <div className="charts-compressions-select">
                <div></div>
            </div>
        </div>
    )
}

export default ChartsOptions;