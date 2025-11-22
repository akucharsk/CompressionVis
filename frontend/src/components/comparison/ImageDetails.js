import React, { useState } from "react";
import { useMetrics } from "../../context/MetricsContext";
import { useSettings } from "../../context/SettingsContext";

const formatValue = (value) => {
    if (value === null) return "null";
    if (value === undefined) return "undefined";
    if (typeof value === "number") return value.toFixed(3);
    if (typeof value === "object") {
        try {
            return JSON.stringify(value, null, 2);
        } catch {
            return String(value);
        }
    }
    return String(value);
};

const renderEntries = (obj) => {
    return Object.entries(obj || {})
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value], idx) => {
            const formatted = formatValue(value);
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
                          isOriginalChosen = false,
                          selectedIdx = 0,
                      }) => {
    const { videoMetricsQuery, frameMetricsQuery } = useMetrics();
    const { parameters } = useSettings();
    const [showCompression, setShowCompression] = useState(false);

    if (videoMetricsQuery.error || frameMetricsQuery.error)
        return <p>Error loading metrics</p>;

    const videoData = videoMetricsQuery.data || {};
    const videoMetrics = videoData.metrics || videoData || {};

    const frameMetrics = frameMetricsQuery.data?.metrics;

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
                <div className="metric-header">Metric</div>
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
                    {renderEntries(parameters)}
                </div>
            )
            }
        </div>
    )
        ;
};

export default ImageDetails;
