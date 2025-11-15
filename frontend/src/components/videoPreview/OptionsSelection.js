import React, {useEffect, useState} from "react";
import DropdownSelect from "./DropdownSelect";
import { useSettings } from "../../context/SettingsContext";
import {apiUrl} from "../../utils/urls";
import "../../styles/components/video/OptionsSelection.css";
import {useError} from "../../context/ErrorContext";
import {handleApiError} from "../../utils/errorHandler";

const OptionsSection = ({ handleCompress }) => {
    const { parameters, setParameters } = useSettings();
    const [originalSize, setOriginalSize] = useState(null);
    const [loadingSize, setLoadingSize] = useState(false);
    const {showError} = useError();
    const [sizeInput, setSizeInput] = useState("");

    const handleSizeChange = (e) => {
        setSizeInput(e.target.value);
    };

    const handleSizeBlur = () => {
        const value = sizeInput.replace(",", ".").trim();
        if (!value) {
            setSizeInput("1");
            updateParam("compressedSize")((1024 * 1024).toString());
            return;
        }

        let num = parseFloat(value);
        if (isNaN(num)) return;

        const minMB = 1;
        const maxMB = originalSize ? originalSize / (1024 * 1024) : 100;

        if (num < minMB) num = minMB;
        if (num > maxMB) num = maxMB;

        const formatted = Number(num.toFixed(2)).toString();

        setSizeInput(formatted);
        updateParam("compressedSize")(Math.round(num * 1024 * 1024).toString());
    };

    useEffect(() => {
        if (parameters.compressedSize) {
            setSizeInput((parameters.compressedSize / (1024 * 1024)).toFixed(2));
        }
    }, [parameters.compressedSize]);

    const updateParam = (key) => (value) => {
        setParameters((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const optionsConfig = [
        {
            label: "Resolution",
            value: parameters.resolution,
            onChange: updateParam("resolution"),
            options: [
                { value: "1920x1080", label: "1920x1080" },
                { value: "1280x720", label: "1280x720" },
                { value: "960x540", label: "960x540" },
                { value: "854x480", label: "854x480" },
                { value: "640x360", label: "640x360" },
                { value: "426x240", label: "426x240" },
            ],
        },
        {
            label: "GOP Size (Keyframe Interval)",
            value: parameters.pattern,
            onChange: updateParam("pattern"),
            options: [
                { value: "default", label: "default"},
                { value: "30", label: "30 (short)" },
                { value: "60", label: "60 (medium)" },
                { value: "120", label: "120 (long)" },
                { value: "250", label: "250 (very long)" },
            ],
        },
        {
            label: "B‑Frames",
            value: parameters.bFrames,
            onChange: updateParam("bFrames"),
            options: [
                { value: "default", label: "default" },
                { value: "0", label: "0 (none)" },
                { value: "2", label: "2" },
                { value: "4", label: "4" },
                { value: "8", label: "8" },
            ],
        },
        {
            label: "AQ Mode",
            value: parameters.aqMode,
            onChange: updateParam("aqMode"),
            options: [
                { value: "0", label: "0 (disabled)" },
                { value: "1", label: "1 (variance‑based)" },
                { value: "2", label: "2 (masked detail)" },
                { value: "3", label: "3 (composite)" },
            ],
        },
        {
            label: "AQ Strength",
            value: parameters.aqStrength,
            onChange: updateParam("aqStrength"),
            options: [
                { value: "0.8", label: "0.8" },
                { value: "1.0", label: "1.0" },
                { value: "1.2", label: "1.2" },
                { value: "1.4", label: "1.4" },
                { value: "1.6", label: "1.6" },
            ],
        },
        {
            label: "Preset (speed)",
            value: parameters.preset,
            onChange: updateParam("preset"),
            options: [
                { value: "ultrafast", label: "ultrafast" },
                { value: "fast", label: "fast" },
                { value: "medium", label: "medium" },
                { value: "slow", label: "slow" },
                { value: "veryslow", label: "veryslow" },
            ],
        }
    ];

    const crfOptions = {
        label: "Constant Rate Factor",
        value: parameters.crf,
        onChange: updateParam("crf"),
        options: [
            { value: "10", label: "10" },
            { value: "20", label: "20" },
            { value: "25", label: "25" },
            { value: "30", label: "30" },
            { value: "35", label: "35" },
            { value: "40", label: "40" },
            { value: "51", label: "51 (max)" },
        ],
    };

    const bandwidthOptions = {
        label: "Bandwidth",
        value: parameters.bandwidth,
        onChange: updateParam("bandwidth"),
        options: [
            { value: "64k", label: "64kb/s" },
            { value: "128k", label: "128kb/s" },
            { value: "1M", label: "1Mb/s" },
            { value: "5M", label: "5Mb/s" },
            { value: "10M", label: "10Mb/s" },
        ],
    };

    const renderContent = () => {
        switch (parameters.mode) {
            case "parameters":
                return (
                    <>
                        <div className="quality-controls-frame">
                            <label>
                                Quality Control
                                <span className="tooltip-container">
                                <span className="tooltip-text">
                                  <strong>CRF</strong> dynamically adjusts bitrate based on scene complexity
                                  to keep consistent visual quality. Ideal when quality matters more
                                  than file size.<br/>
                                  <strong>Bandwidth</strong> targets a constant data rate (e.g., 3000 kb/s),
                                  providing predictable file size but possibly lower quality in complex scenes.
                                </span>
                              </span>
                            </label>
                            <div className="quality-controls-parameters">
                                <div
                                    className={`quality-field ${parameters.qualityMode === "crf" ? "active" : "inactive"}`}
                                    onClick={() => {
                                        setParameters({
                                            ...parameters,
                                            qualityMode: "crf",
                                        })
                                    }}
                                >
                                    <DropdownSelect {...crfOptions} />
                                </div>

                                <div
                                    className={`quality-field ${parameters.qualityMode === "bandwidth" ? "active" : "inactive"}`}
                                    onClick={() => {
                                        setParameters({
                                            ...parameters,
                                            qualityMode: "bandwidth",
                                        })
                                    }}
                                >
                                    <DropdownSelect {...bandwidthOptions} />
                                </div>
                            </div>
                        </div>

                        <div className="parameters-section">
                            {optionsConfig.map((config) => (
                                <DropdownSelect key={config.label} {...config} />
                            ))}
                        </div>
                    </>
                );
            case "compressedSize":
                const originalSizeMB = originalSize ? (originalSize / (1024 * 1024)).toFixed(2) : null;
                const maxSizeMB = originalSize ? originalSize / (1024 * 1024) / 10 : 100;

                return (
                    <div className="size-slider-container">
                        <div className="video-info">
                            <p>Original Size: <strong>
                                {loadingSize ? "Loading..." :
                                    originalSizeMB !== null ? `${originalSizeMB} MB` : "Unknown"}
                            </strong></p>
                        </div>
                        <label>Compressed Size:</label>

                        <input
                            type="range"
                            min="1"
                            max={maxSizeMB}
                            step="0.001"
                            value={parameters.compressedSize / (1024 * 1024)}
                            onChange={(e) => {
                                const mbValue = parseFloat(e.target.value);
                                const bytesValue = Math.round(mbValue * 1024 * 1024);
                                updateParam("compressedSize")(bytesValue.toString());
                            }}
                            className="size-slider"
                        />

                        <div className="size-input-container">
                            <input
                                type="text"
                                value={sizeInput}
                                onChange={handleSizeChange}
                                onBlur={handleSizeBlur}
                                placeholder="Enter size in MB"
                                className="size-input"
                            />
                            <span className="size-unit">MB</span>
                        </div>
                        <p className="size-hint">
                            <strong>Note:</strong> The encoder targets this size by estimating bitrate.
                            Complex scenes may result in a slightly different final file size.
                        </p>
                    </div>
                );
            default:
                return null;
        }
    };

    useEffect(() => {
        const defaultOptions = {
            resolution: "1280x720",
            pattern: "250",
            crf: "20",
            preset: "medium",
            bFrames: "2",
            aqMode: "2",
            aqStrength: "1.0",
            bandwidth: "5M",
            compressedSize: (1024 * 1024).toString(),
            qualityMode: "crf",
            mode: "parameters",
        };

        setParameters((prev) => ({
            ...prev,
            ...defaultOptions,
        }));
    }, [setParameters]);

    useEffect(() => {
        const fetchVideoSize = async () => {
            if (!parameters.videoId) return;

            setLoadingSize(true);
            try {
                const resp = await fetch(`${apiUrl}/video/size/${parameters.videoId}/`);
                await handleApiError(resp);
                const data = await resp.json();
                setOriginalSize(data.size);
            } catch (error) {
                showError(error.message, error.statusCode);
            } finally {
                setLoadingSize(false);
            }
        };

        const loadVideoSize = async () => {
            if (parameters.videoId) {
                try {
                    await fetchVideoSize();
                } catch (error) {
                    showError(error.message, error.statusCode);
                }
            }
        };

        void loadVideoSize();
    }, [parameters.videoId, showError]);

    return (
        <div className="options-section">
            <h2>Options</h2>
            <div className="mode-buttons">
                <button
                    className={parameters.mode === "parameters" ? "active" : ""}
                    onClick={() => {
                        setParameters((prev) => ({
                            ...prev,
                            mode: "parameters"
                        }));
                    }}
                >
                    Parameters
                </button>
                <button
                    className={parameters.mode === "compressedSize" ? "active" : ""}
                    onClick={() => {
                        setParameters((prev) => ({
                            ...prev,
                            mode: "compressedSize"
                        }));
                    }}
                >
                    Compressed Size
                </button>
            </div>
            {renderContent()}
            <button className="compress-btn" onClick={handleCompress}>
                COMPRESS
            </button>
        </div>
    );
};

export default OptionsSection;