import React, {useEffect, useState} from "react";
import {useMetrics} from "../../context/MetricsContext";
import {apiUrl} from "../../utils/urls";
import {useCustomMetrics} from "./useMetricsFetch";
import {useSearchParams} from "react-router-dom";
import {useVideoPlaying} from "../../context/VideoPlayingContext";

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

const formatToKB = (bytes) => {
    if (typeof bytes !== "number" || isNaN(bytes)) {
        return "N/A";
    }
    return (bytes / 1024).toFixed(2);
}

const renderEntries = (obj) => {
    return Object.entries(obj || {})
        .sort(([a], [b]) => a.localeCompare(b))
        .filter(([, value]) => value !== null && value !== undefined)
        .filter(([key, ]) => key !== "name")
        .filter(([key, ]) => key !== "size")
        .map(([key, value], idx) => {
            let formatted;
            if (key === "size") {
                formatted = formatToMB(value) + " MB";
            }
            else if (key === "gopSize" && value === 1) {
                formatted = "default";
                key = mapKey(key);
            }
            else if (key === "bandwidth") {
                formatted = formatValue(value,0) / 1000 + " kb/s";
                key = mapKey(key);
            }
            else {
                formatted = formatValue(value,0);
                key = mapKey(key);
            }

            const isObject = typeof value === "object" && value !== null;

            return (
                <div className="detail-row" key={`entry-${idx}`}>
                    <div className="detail-key">{key}</div>
                    <div className="detail-value">
                        {isObject ? (
                            <pre className="detail-json">{formatted}</pre>
                        ) : (
                            <span>{formatted}</span>
                        )}
                    </div>
                </div>
            );
        });
};

const ImageDetails = ({
                          isOriginalChosen = true,
                          isConst = true,
                          selectedVideoId = 0,
                      }) => {
    const {videoMetricsQuery, frameMetricsQuery} = useMetrics();
    const [showCompression, setShowCompression] = useState(false);
    const [parametersForComparison, setParametersForComparison] = useState(null);
    const shouldFetchCustomMetrics = !isOriginalChosen && !!selectedVideoId;
    const { frameMetricsQueryCustom, videoMetricsQueryCustom } = useCustomMetrics(shouldFetchCustomMetrics ? selectedVideoId : null); 
    const [sizeForFrame, setSizeForFrame] = useState(null);
    const [sizeForVideo, setSizeForVideo] = useState(null);
    const {isVideoPlaying} = useVideoPlaying();

    const [params] = useSearchParams();
    const selectedIdx = parseInt(params.get("frameNumber")) || 0;

    const fetchCompressionParamsForComparison = async () => {
        const url = `${apiUrl}/video/parameters/${selectedVideoId}`;
        const resp = await fetch(url);
        const data = await resp.json();
        setParametersForComparison(data);
        setSizeForVideo(data.size);
    }

    const fetchFrameSizeForComparison = async () => {
        const url = `${apiUrl}/frame/size/${selectedVideoId}/${selectedIdx}`;
        const resp = await fetch(url);
        const data = await resp.json();
        setSizeForFrame(data.size);
    }

    useEffect(() => {
        if (isOriginalChosen) return;
        fetchCompressionParamsForComparison();
    }, [isOriginalChosen, selectedVideoId]);

    useEffect(() => {
        if (isOriginalChosen || isVideoPlaying) return;
        fetchFrameSizeForComparison();
    }, [selectedIdx, selectedVideoId, isOriginalChosen]);

    if (isConst) {
        isOriginalChosen = false;
    }

    if (videoMetricsQuery.error || frameMetricsQuery.error)
        return <p>Error loading metrics</p>;

    let videoData = {};

    if (isConst) {
        videoData = videoMetricsQuery.data || {};
    }
    else {
        if (!isOriginalChosen) {
            videoData = videoMetricsQueryCustom.data || {};
        }
    }
    const videoMetrics = videoData.metrics || videoData || {};

    let frameMetrics;
    if (isConst) {
        frameMetrics = frameMetricsQuery.data?.metrics;
    }
    else {
        if (!isOriginalChosen) {
            frameMetrics = frameMetricsQueryCustom.data?.metrics;
        }
    }

    const selectedFrame =
        Array.isArray(frameMetrics) && frameMetrics.length > selectedIdx
            ? frameMetrics[selectedIdx]
            : null;
    const maxMetricsValues = {
        PSNR: "---",
        SSIM: "1   (Max Score)",
        VMAF: "100 (Max Score)",
    };

    return (
        <div className="image-details">
            <div className="metrics-grid">
                <div className="metric-header"></div>
                <div className="metric-header">Video</div>
                <div className="metric-header">Frame</div>

                {["PSNR", "SSIM", "VMAF"].map((key) => (
                    <React.Fragment key={key}>
                        <div className="metric-cell">{key}</div>

                        <div className="metric-cell">
                            {isOriginalChosen
                                ? maxMetricsValues[key]
                                : formatValue(videoMetrics?.[key])}
                        </div>

                        <div className="metric-cell">
                            {isOriginalChosen
                                ? maxMetricsValues[key]
                                : formatValue(selectedFrame?.[key])}
                        </div>
                    </React.Fragment>
                ))}
                <div className="metric-cell">Size </div>
                <div className="metric-cell">
                    {isOriginalChosen
                        ? "---"
                        : formatToMB(sizeForVideo,0) + " MB"}
                </div>
                <div className="metric-cell">
                    {isOriginalChosen
                        ? "---"
                        : formatToKB(sizeForFrame, 0) + " KB"}
                </div>
            </div>

            {!isOriginalChosen &&
            <h3
                className="collapsible-header"
                onClick={() => setShowCompression((prev) => !prev)}
                style={{cursor: "pointer"}}
            >
                Compression Parameters
                <span style={{fontSize: "0.9rem", opacity: 0.6}}>
                    {showCompression ? "▲" : "▼"}
                </span>
            </h3>
            }

            {!isOriginalChosen && showCompression && (
                <div className="compression-section">
                    {renderEntries(parametersForComparison)}
                </div>
            )
            }
        </div>
    )
        ;
};

export default ImageDetails;
