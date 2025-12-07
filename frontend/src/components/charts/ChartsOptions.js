import "../../styles/components/charts/ChartsOptions.css";
import { useEffect, useState } from "react";
import Spinner from "../Spinner";

const ChartsOptions = () => {

    // const [compressedVideos, setCompressedVideos] = useState([]);

    // useEffect(() => {

    // }, [compressedVideos])

    const compressedVideos = [
        1,
        2,
        3,
        4,
        5,
        6,
        8,
        9999,
        0,
    ];

    return (
        // <div className="chfds">
        <div className="charts-options">
            {/* <div className="charts-scene-threshold">
                threshold
            </div> */}
            {compressedVideos.map((name, idx) => (
                <div className={`compression-in-select-panel ${name === 0 ? "disactive" : "active"}`} key={idx}>
                    <div className="selection-option-left">
                        <div>Compression {name}</div>
                    </div>
                    <div className="selection-option-right">
                        {name === 0 ? (
                            <Spinner size={16}/>
                        ) : (
                        <div></div>
                        )}
                    </div>

                </div>
            ))}
        </div>
        // </div>
    )
}

export default ChartsOptions;