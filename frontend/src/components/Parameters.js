import { useSettings } from "../context/SettingsContext";
import "../styles/components/distribution/Macroblock.css";

const Parameters = () => {
    const { parameters } = useSettings();

    return (
        <div className="frame-info">
            <h3>Video Parameters</h3>
            <p>Bandwidth: {parameters.bandwidth}</p>
            <p>Resolution: {parameters.resolution}</p>
            <p>GOP: {parameters.pattern}</p>
            <p>CRF: {parameters.crf}</p>
            <p>Framerate: {parameters.framerate}</p>
        </div>
    )
};

export default Parameters;