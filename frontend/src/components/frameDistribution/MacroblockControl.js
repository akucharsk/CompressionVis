import Spinner from "../Spinner";
import {useMacroblocks} from "../../context/MacroblocksContext";

const MacroblockControl = ({setShowGrid, setShowVectors, showGrid, showVectors, toggleCategory, visibleCategories}) => {
    const { triggerMacroblocksExtraction } = useMacroblocks();

    return (
        <div className="frame-preview-right">
            <div className="macroblock-controls-box">
                <button
                    className="show-macroblock-grid"
                    onClick={() => setShowGrid(!showGrid)}
                    disabled={!triggerMacroblocksExtraction.isSuccess}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        {triggerMacroblocksExtraction.isLoading && <Spinner size={15} />}
                        {showGrid ? "Hide macroblock grid" : "Show macroblock grid"}
                    </div>
                </button>

                <div className={`checkbox-container ${showGrid ? 'expanded' : 'collapsed'}`}>
                    <label>
                        <input
                            type="checkbox"
                            checked={visibleCategories.intra}
                            onChange={() => toggleCategory("intra")}
                        />
                        <span style={{ color: "rgb(255, 0, 0)" }}> Intra</span>
                    </label>

                    <label>
                        <input
                            type="checkbox"
                            checked={visibleCategories.inter}
                            onChange={() => toggleCategory("inter")}
                        />
                        <span style={{ color: "rgb(0, 255, 0)" }}> Inter</span>
                    </label>

                    <label>
                        <input
                            type="checkbox"
                            checked={visibleCategories.skip}
                            onChange={() => toggleCategory("skip")}
                        />
                        <span style={{ color: "rgb(0, 0, 255)" }}> Skip</span>
                    </label>

                    <label>
                        <input
                            type="checkbox"
                            checked={visibleCategories.direct}
                            onChange={() => toggleCategory("direct")}
                        />
                        <span style={{ color: "rgb(0, 255, 255)" }}> Direct</span>
                    </label>
                </div>
            </div>

            <button
                className="show-macroblock-vectors"
                onClick={() => setShowVectors(!showVectors)}
                disabled={!triggerMacroblocksExtraction.isSuccess}
            >
                <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    {triggerMacroblocksExtraction.isLoading && <Spinner size={15} />}
                    {showVectors ? "Hide motion vectors" : "Show motion vectors"}
                </div>
            </button>
        </div>
    )
}
export default MacroblockControl;