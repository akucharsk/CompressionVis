import { useMacroblocks } from "../../context/MacroblocksContext";

const MacroblockControl = ({
                               setShowGrid,
                               showGrid,
                               toggleCategory,
                               visibleCategories,
                               mode,
                               setMode,
                               showPast,
                               setShowPast,
                               showFuture,
                               showBidirectional,
                               setShowBidirectional,
                               setShowFuture
                           }) => {
    const { isBlocksLoading } = useMacroblocks();

    const isGridActive = showGrid && mode === "grid";
    const isBlocksActive = showGrid && mode === "disappear";

    const handleGridCheck = () => {
        if (isGridActive) {
            setMode("off");
            setShowGrid(false);
        } else {
            setMode("grid");
            setShowGrid(true);
        }
    };

    const handleBlocksCheck = () => {
        if (isBlocksActive) {
            setMode("off");
            setShowGrid(false);
        } else {
            setMode("disappear");
            setShowGrid(true);
        }
    };

    const handlePastChange = (e) => {
        const isChecked = e.target.checked;
        setShowPast(isChecked);
        if (isChecked) {
            setShowBidirectional(false);
        }
    };

    const handleFutureChange = (e) => {
        const isChecked = e.target.checked;
        setShowFuture(isChecked);
        if (isChecked) {
            setShowBidirectional(false);
        }
    };

    const handleBidirectionalChange = (e) => {
        const isChecked = e.target.checked;
        setShowBidirectional(isChecked);
        if (isChecked) {
            setShowPast(false);
            setShowFuture(false);
        }
    };

    return (
        <div className="content-box">
            <div className="macroblock-static-panel">

                <div className="control-section">
                    <div className="section-header-column">
                        <span className="section-title">Macroblocks:</span>

                        <div className="top-checkboxes">
                            <label className={`vector-checkbox ${isBlocksLoading ? "disabled" : ""}`}>
                                <input
                                    type="checkbox"
                                    checked={isGridActive}
                                    onChange={handleGridCheck}
                                    disabled={isBlocksLoading}
                                />
                                Show Grid
                            </label>
                            <label className={`vector-checkbox ${isBlocksLoading ? "disabled" : ""}`}>
                                <input
                                    type="checkbox"
                                    checked={isBlocksActive}
                                    onChange={handleBlocksCheck}
                                    disabled={isBlocksLoading}
                                />
                                Show Blocks
                            </label>
                        </div>
                    </div>

                    <div className={`macroblock-types-grid ${!showGrid ? "disabled-area" : ""} ${isBlocksLoading ? "loading" : ""}`}>
                        {[
                            { key: "intra", label: "Intra", class: "label-intra" },
                            { key: "inter", label: "Inter", class: "label-inter" },
                            { key: "skip", label: "Skip", class: "label-skip" },
                            { key: "direct", label: "Direct", class: "label-direct" }
                        ].map(({ key, label, class: c }) => (
                            <label key={key} className="type-checkbox-item">
                                <input
                                    type="checkbox"
                                    checked={visibleCategories[key]}
                                    onChange={() => toggleCategory(key)}
                                    disabled={isBlocksLoading || !showGrid}
                                />
                                <span className="label-dot-wrapper">
                                    <span className={`label-dot ${c}`}></span> {label}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="section-divider"></div>

                <div className="control-section">
                    <div className="section-header-column">
                        <span className="section-title">Motion vectors:</span>
                        <div className="top-checkboxes">
                            <label className={`vector-checkbox ${isBlocksLoading ? "disabled" : ""}`}>
                                <input
                                    type="checkbox"
                                    checked={showPast}
                                    onChange={handlePastChange}
                                    disabled={isBlocksLoading}
                                />
                                Past
                            </label>
                            <label className={`vector-checkbox ${isBlocksLoading ? "disabled" : ""}`}>
                                <input
                                    type="checkbox"
                                    checked={showFuture}
                                    onChange={handleFutureChange}
                                    disabled={isBlocksLoading}
                                />
                                Future
                            </label>
                        </div>
                        <label className={`vector-checkbox ${isBlocksLoading ? "disabled" : ""}`}>
                            <input
                                type="checkbox"
                                checked={showBidirectional}
                                onChange={handleBidirectionalChange}
                                disabled={isBlocksLoading}
                            />
                            Only Bidirectional
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MacroblockControl;