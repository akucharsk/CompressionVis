const MacroblockControl = ({setShowGrid, setShowVectors, showGrid, showVectors, toggleCategory, visibleCategories}) => {
    return (
        <div className="frame-preview-right">
            <div className="macroblock-controls-box">
                <button
                    className="show-macroblock-grid"
                    onClick={() => setShowGrid(!showGrid)}
                >
                    {showGrid ? "Hide grid" : "Show grid"}
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
            >
                {showVectors ? "Hide vectors" : "Show vectors"}
            </button>
        </div>
    )
}
export default MacroblockControl;