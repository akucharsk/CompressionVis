import React from "react";
import "../../styles/components/distribution/Macroblock.css";
import Parameters from "../Parameters";
import MacroblockControl from "./MacroblockControl";
import MacroblockInfo from "./MacroblockInfo";

const SidePanel = ({
                       frames,
                       selectedIdx,
                       setShowGrid,
                       setShowVectors,
                       showGrid,
                       showVectors,
                       toggleCategory,
                       visibleCategories,
                       selectedBlock,
                       mode,
                       setMode
                   }) => {
    return (
        <div className="right-section">
            <Parameters />
            <div className="content-box info">
                <h3>Frame Information</h3>
                <p>Frame: {selectedIdx + 1}</p>
                <p>Type: {frames[selectedIdx]?.type}</p>
                <p>PTS time: {parseFloat(frames[selectedIdx]?.pts_time).toFixed(2)}s</p>
                <p>
                    Frame size:{" "}
                    {Intl.NumberFormat("pl-PL").format(frames[selectedIdx]?.pkt_size)}B
                </p>
            </div>
            <MacroblockControl
                setShowGrid={setShowGrid}
                setShowVectors={setShowVectors}
                showGrid={showGrid}
                showVectors={showVectors}
                toggleCategory={toggleCategory}
                visibleCategories={visibleCategories}
                mode={mode}
                setMode={setMode}
            />
            <MacroblockInfo selectedBlock={selectedBlock} />
        </div>
    );
};

export default SidePanel;
