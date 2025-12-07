import "../../styles/components/charts/ChartsOptions.css";
import { useEffect, useState } from "react";

const ChartsOptions = () => {

    // const [compressedVideos, setCompressedVideos] = useState([]);

    // useEffect(() => {

    // }, [compressedVideos])

    const compressedVideos = [
        "kompresja 1",
        "kompresja 1",
        "kompresja 1",
        "kompresja 1",
        "kompresja 1",
        "kompresja 1",
        "kompresja 1",
        "kompresja 1",
        "kompresja 1",
        "kompresja 1",
        "kompresja 1",
        "kompresja 1",
        "kompresja 1",
        "kompresja 1",
        "kompresja 1",
        "kompresja 1",
        "kompresja 1",
        "kompresja 1",
        "kompresja 1",
        "kompresja 1",
        "kompresja 1",
        "kompresja 1",
        "kompresja 1",
        "kompresja 1",
        "kompresja 1",
        "kompresja 1",
        "kompresja 1",
        "kompresja 1",
        "kompresja 1",
        "kompresja 1",
        "kompresja 1",
    ];

    return (
        // <div className="chfds">
        <div className="charts-options">
            {/* <div className="charts-scene-threshold">
                threshold
            </div> */}
            {compressedVideos.map((name, idx) => (
                <div className="compression-in-select-panel" key={idx}>
                    {name}
                </div>
            ))}
        </div>
        // </div>
    )
}

export default ChartsOptions;