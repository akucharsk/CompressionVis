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
                       showGrid,
                       toggleCategory,
                       visibleCategories,
                       selectedBlock,
                       mode,
                       setMode,
                       showPast,
                       setShowPast,
                       showFuture,
                       setShowFuture,
                       showBidirectional,
                       setShowBidirectional
                   }) => {
    return (
        <div className="right-section">
            <Parameters />
            <FrameInfoBox />
            <MacroblockControl
                setShowGrid={setShowGrid}
                showGrid={showGrid}
                toggleCategory={toggleCategory}
                visibleCategories={visibleCategories}
                mode={mode}
                setMode={setMode}
                showPast={showPast}
                setShowPast={setShowPast}
                showFuture={showFuture}
                setShowFuture={setShowFuture}
                showBidirectional={showBidirectional}
                setShowBidirectional={setShowBidirectional}
            />
            <MacroblockInfo selectedBlock={selectedBlock} frames={frames} currentFrameIdx={selectedIdx}/>
        </div>
    );
};

export default SidePanel;
