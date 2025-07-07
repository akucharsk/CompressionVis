import React, {useEffect, useState} from "react";
import DropdownSelect from "./DropdownSelect";
import { useSettings } from "../../context/SettingsContext";
import {apiUrl} from "../../utils/urls";
import "../../styles/components/video/OptionsSelection.css";

const OptionsSection = ({ handleCompress }) => {
    const { parameters, setParameters } = useSettings();
    const [mode, setMode] = useState("parameters");
    const [qualityMode, setQualityMode] = useState("crf");
    const [originalSize, setOriginalSize] = useState(null);
    const [loadingSize, setLoadingSize] = useState(false);

    const fetchVideoSize = async () => {
        if (!parameters.videoId) return;

        setLoadingSize(true);
        try {
            const resp = await fetch(`${apiUrl}/video/size/${parameters.videoId}/`);
            if (!resp.ok) {
                console.error("Failed to fetch video size");
                return;
            }
            const data = await resp.json();
            setOriginalSize(data.size);
        } catch (error) {
            console.error("Error fetching video size:", error);
        } finally {
            setLoadingSize(false);
        }
    };

    const handleBestParameters = async () => {
        try {
            const resp = await fetch(`${apiUrl}/video/best-parameters/${parameters.videoId}/`);
            if (!resp.ok) {
                alert("Failed to fetch best parameters. Please try again later.");
                return;
            }
            const data = await resp.json();
            setParameters((prev) => ({
                ...prev,
                resolution: data.resolution || parameters.resolution,
                pattern: data.pattern || parameters.pattern,
                crf: String(data.crf) || parameters.crf,
                qualityMode: "crf",
                preset: data.preset || parameters.preset,
                bFrames: String(data.bFrames) || parameters.bFrames,
                aqMode: String(data.aqMode) || parameters.aqMode,
                aqStrength: String(data.aqStrength) || parameters.aqStrength,
            }));
        } catch (error) {
            alert("Error fetching best parameters");
        }
    };

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
        switch (mode) {
            case "parameters":
                return (
                    <>
                        <div className="quality-controls-frame">
                            <label>
                                Quality Control
                                <span className="tooltip-container">
                                <span className="info-icon">❔</span>
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
                                    className={`quality-field ${qualityMode === "crf" ? "active" : "inactive"}`}
                                    onClick={() => {
                                        setQualityMode("crf")
                                        setParameters({
                                            ...parameters,
                                            qualityMode: "crf",
                                        })
                                    }}
                                >
                                    <DropdownSelect {...crfOptions} />
                                </div>

                                <div
                                    className={`quality-field ${qualityMode === "bandwidth" ? "active" : "inactive"}`}
                                    onClick={() => {
                                        setQualityMode("bandwidth")
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

                        <button className="best-parameters-btn" onClick={handleBestParameters}>
                            SET BEST PARAMETERS
                        </button>
                    </>
                );
            case "compressedSize":
                return (
                    <div className="size-slider-container">
                        <div className="video-info">
                            <p>Original Size: <strong>
                                {loadingSize ? "Loading..." :
                                    originalSize !== null ? `${Intl.NumberFormat('pl-PL').format(originalSize)} B` : "Unknown"}
                            </strong></p>
                        </div>
                        <label>Compressed Size:</label>

                        <input
                            type="range"
                            min="1000"
                            max={originalSize ? parseInt(originalSize, 10) / 10 : 1_000_000}
                            step="1"
                            value={parameters.compressedSize}
                            onChange={(e) => updateParam("compressedSize")(e.target.value)}
                            className="size-slider"
                        />

                        <div className="size-input-container">
                            <input
                                type="text"
                                value={Intl.NumberFormat('pl-PL').format(parameters.compressedSize)}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/\s/g, ''); // usuń spacje

                                    if (value === '') {
                                        updateParam("compressedSize")('');
                                        return;
                                    }

                                    const cleanValue = value.replace(/\D/g, '');

                                    if (cleanValue === '') {
                                        return;
                                    }

                                    const numValue = parseInt(cleanValue, 10);
                                    const maxValue = originalSize ? parseInt(originalSize, 10) : 1000;
                                    const minValue = 1000;

                                    if (numValue >= minValue && numValue <= maxValue) {
                                        updateParam("compressedSize")(cleanValue);
                                    } else if (numValue < minValue) {
                                        updateParam("compressedSize")(minValue.toString());
                                    } else {
                                        updateParam("compressedSize")(maxValue.toString());
                                    }
                                }}
                                onBlur={(e) => {
                                    if (e.target.value === '') {
                                        updateParam("compressedSize")('1000');
                                    }
                                }}
                                placeholder="Enter size in bytes"
                                className="size-input"
                            />
                            <span className="size-unit">B</span>
                        </div>
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
            compressedSize: "1000",
            qualityMode: "crf",
        };

        setParameters((prev) => ({
            ...prev,
            ...defaultOptions,
        }));
    }, [setParameters]);

    useEffect(() => {
        const loadVideoSize = async () => {
            if (parameters.videoId) {
                try {
                    await fetchVideoSize();
                } catch (error) {
                    console.error("Failed to fetch video size:", error);
                }
            }
        };

        void loadVideoSize();
    }, [parameters.videoId]);

    return (
        <div className="options-section">
            <h2>Options</h2>
            <div className="mode-buttons">
                <button
                    className={mode === "parameters" ? "active" : ""}
                    onClick={() => {
                        setMode("parameters");
                        setParameters((prev) => ({
                            ...prev,
                            mode: "parameters"
                        }));
                    }}
                >
                    Parameters
                </button>
                <button
                    className={mode === "compressedSize" ? "active" : ""}
                    onClick={() => {
                        setMode("compressedSize");
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