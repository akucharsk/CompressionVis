import Spinner from "../Spinner";
import { useMacroblocks } from "../../context/MacroblocksContext";

const MacroblockControl = ({
                               setShowGrid,
                               setShowVectors,
                               showGrid,
                               showVectors,
                               toggleCategory,
                               visibleCategories
                           }) => {
    const { isBlocksLoading } = useMacroblocks();

    return (
        <>
            <div className="content-box">
                <button
                    className={`macroblock-btn ${showGrid ? "expanded" : ""}`}
                    onClick={() => setShowGrid(!showGrid)}
                    disabled={isBlocksLoading}
                >
                    {isBlocksLoading && <Spinner size={15} />}
                    {showGrid ? "Hide macroblock grid" : "Show macroblock grid"}
                </button>

                <div className={`checkbox-container ${showGrid ? "expanded" : "collapsed"} ${isBlocksLoading ? "loading" : ""}`}>
                    {[
                        { key: "intra", label: "Intra", class: "label-intra" },
                        { key: "inter", label: "Inter", class: "label-inter" },
                        { key: "skip", label: "Skip", class: "label-skip" },
                        { key: "direct", label: "Direct", class: "label-direct" }
                    ].map(({ key, label, class: c }) => (
                        <label key={key}>
                            <input
                                type="checkbox"
                                checked={visibleCategories[key]}
                                onChange={() => toggleCategory(key)}
                                disabled={isBlocksLoading}
                            />
                            <span className="label-dot-wrapper">
                                <span className={`label-dot ${c}`}></span> {label}
                            </span>
                        </label>
                    ))}
                </div>
            </div>

            <div className="content-box">
                <button
                    className="macroblock-btn content-box"
                    onClick={() => setShowVectors(!showVectors)}
                    disabled={isBlocksLoading}
                >
                    {isBlocksLoading && <Spinner size={15} />}
                    {showVectors ? "Hide motion vectors" : "Show motion vectors"}
                </button>
            </div>
        </>
    );
};

export default MacroblockControl;