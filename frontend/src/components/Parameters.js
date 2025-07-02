import { useSettings } from "../context/SettingsContext";
import "../styles/components/distribution/Macroblock.css";

const Parameters = () => {
    const { parameters } = useSettings();

    return (
        <div className="frame-info">
            <h3>Video Parameters</h3>
            <p>Resolution: {parameters.resolution}</p>
            <p>GOP: {parameters.pattern}</p>
            <p>CRF: {parameters.crf}</p>
            <p>Preset: {parameters.preset}</p>
            <p>B-frames: {parameters.bFrames}</p>
            <p>AQ-mode: {parameters.aqMode}</p>
            <p>AQ-strength: {parameters.aqStrength}</p>
        </div>
    )
};

export default Parameters;