import React, {useEffect} from "react";
import DropdownSelect from "./DropdownSelect";
import { useSettings } from "../../context/SettingsContext";
import "../../styles/components/video/OptionsSelection.css";

const OptionsSection = ({ handleCompress }) => {
    const { parameters, setParameters } = useSettings();

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

    useEffect(() => {
        const defaultOptions = {
            resolution: "1280x720",
            pattern: "250",
            crf: "20",
            preset: "medium",
            bFrames: "2",
            aqMode: "2",
            aqStrength: "1.0"
        };

        setParameters((prev) => ({
            ...prev,
            ...defaultOptions,
        }));
    }, [setParameters]);

    return (
        <div className="options-section">
            <h2>Options</h2>
            {optionsConfig.map((config) => (
                <DropdownSelect key={config.label} {...config} />
            ))}
            <button className="best-parameters-btn" onClick={() => console.log(parameters)}>
                SET BEST PARAMETERS
            </button>
            <button className="compress-btn" onClick={handleCompress}>
                COMPRESS
            </button>
        </div>
    );
};

export default OptionsSection;
