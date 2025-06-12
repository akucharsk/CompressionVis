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
            label: "Bandwidth",
            value: parameters.bandwidth,
            onChange: updateParam("bandwidth"),
            options: [
                { value: "64k", label: "64kb/s" },
                { value: "128k", label: "128kb/s" },
                { value: "1M", label: "1Mb/s" },
            ],
        },
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
            label: "Framerate",
            value: parameters.framerate,
            onChange: updateParam("framerate"),
            options: [
                { value: "15", label: "15 fps" },
                { value: "30", label: "30 fps" },
                { value: "60", label: "60 fps" },
            ],
        }
    ];

    useEffect(() => {
        const defaultOptions = {
            bandwidth: "128k",
            resolution: "1280x720",
            pattern: "250",
            crf: "20",
            framerate: "30",
        };

        setParameters((prev) => ({
            ...prev,
            ...defaultOptions,
        }));
    }, []);

    return (
        <div className="options-section">
            <h2>Options</h2>
            {optionsConfig.map((config) => (
                <DropdownSelect key={config.label} {...config} />
            ))}

            <button className="compress-btn" onClick={handleCompress}>
                COMPRESS
            </button>
        </div>
    );
};

export default OptionsSection;
