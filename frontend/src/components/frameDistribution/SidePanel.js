import React from "react";
import "../../styles/components/distribution/Macroblock.css";
import Parameters from "../Parameters";
import MacroblockControl from "./MacroblockControl";
import MacroblockInfo from "./MacroblockInfo";
import FrameInfoBox from "./FrameInfoBox";

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
            <FrameInfoBox />
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
