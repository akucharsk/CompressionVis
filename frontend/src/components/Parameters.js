import { useSettings } from "../context/SettingsContext";
import "../styles/components/distribution/Macroblock.css";

const Parameters = () => {
    const { parameters } = useSettings();

    return (
        <div className="content-box info">
            <h3>Video Parameters</h3>
            {parameters.mode === "parameters" && (
                <>
                    <p>Resolution: {parameters.resolution}</p>
                    <p>GOP: {parameters.pattern}</p>
                    {parameters.qualityMode === "crf" && <p>CRF: {parameters.crf}</p>}
                    {parameters.qualityMode === "bandwidth" && <p>Bandwidth: {parameters.bandwidth}</p>}
                    <p>Preset: {parameters.preset}</p>
                    <p>B-frames: {parameters.bFrames}</p>
                    <p>AQ-mode: {parameters.aqMode}</p>
                    <p>AQ-strength: {parameters.aqStrength}</p>
                </>
            )}
            {parameters.mode === "compressedSize" && (
                <p>Resulting Size: {Intl.NumberFormat('pl-PL').format(parameters.resultingSize)} MB</p>
            )}
        </div>
    );
};

export default Parameters;