import {  useNavigate } from "react-router-dom";
import "../styles/pages/CompressedVideos.css";
import Spinner from "../components/Spinner";
import { useCompressedVideos } from "../hooks/compressed-videos";


const formatValue = (value, fractionDigits = 2) => {
    if (value === null) return "null";
    if (value === undefined) return "processing...";
    if (typeof value === "number") return value.toFixed(fractionDigits);
    if (typeof value === "object") {
        try {
            return JSON.stringify(value, null, 2);
        } catch {
            return String(value);
        }
    }
    return String(value);
};

const keyMap = {
    id: "ID",
    aqMode: "AQ mode",
    aqStrength: "AQ strength",
    bf: "B-Frames",
    bandwidth: "Bandwidth",
    crf: "CRF value",
    gopSize: "GOP size",
    preset: "Preset",
    resolution: "Resolution",
    size: "Video size"
};

const prettifyFallback = (key) => {
    const withSpaces = key.replace(/([a-z])([A-Z])/g, "$1 $2");
    return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
};

const mapKey = (key) => {
    return keyMap[key] || prettifyFallback(key);
};

const formatToMB = (bytes) => {
    if (typeof bytes !== "number" || isNaN(bytes)) {
        return "N/A";
    }
    return (bytes / (1024 * 1024)).toFixed(2);
}


const formatCell = (key, value) => {
    if (value === null || value === undefined) {
        return <span style={{ color: '#aaa' }}>N/A</span>;
    }

    switch (key) {
        case "size":
            return `${formatToMB(value)} MB`;
        case "bandwidth":
            return `${formatValue(value, 0) / 1000} kb/s`;
        case "gopSize":
            return value === 1 ? "default" : formatValue(value, 0);
        case "aqStrength":
            return formatValue(value, 2);
        case "crf":
            return formatValue(value, 0);
        default:
            return formatValue(value, 0);
    }
}


const FrameDifferences = () => {
    const { data, isPending } = useCompressedVideos();
    const navigate = useNavigate();

    const displayKeys = [
        "id",
        "title",
        "resolution",
        "size",
        "bandwidth",
        "crf",
        "gopSize",
        "bf",
        "aqMode",
        "aqStrength",
        "preset",
    ];

    return (
        <div className="main-container">
            <h2>Compressed Videos</h2>

            <div className="video-list-content">
                {isPending ? <Spinner /> : data?.videos?.length === 0 ? (
                    <p>No compressed videos available.</p>
                ) : (
                    <div className="videos-table-container">
                        <table className="videos-table">
                            <thead>
                            <tr>
                                {displayKeys.map(key => (
                                    <th key={key}>{mapKey(key)}</th>
                                ))}
                                <th>Navigate</th>
                            </tr>
                            </thead>
                            <tbody>
                            {data?.videos?.map((video) => (
                                <tr key={video.id} className="video-row-details">
                                    {displayKeys.map(key => (
                                        <td key={`${video.id}-${key}`} data-label={mapKey(key)}>
                                            {formatCell(key, video[key])}
                                        </td>
                                    ))}
                                    <td>
                                        <button
                                            onClick={() => navigate(`/compress?videoId=${video.id}&originalVideoId=${video.original}`)}
                                            className="action-button"
                                        >
                                            Go to
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FrameDifferences;