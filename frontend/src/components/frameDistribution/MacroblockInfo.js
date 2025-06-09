import React from "react";
import '../../styles/components/distribution/Macroblock.css';

const MacroblockInfo = ({ frames, selectedIdx, handleOnClick }) => {
    const handleHighlightClick = () => {
        alert("Highlighting macroblocks is not implemented yet.");
    };

    return (
        <div className="right-section">
            <div className="frame-info">
                <h3>Frame Information</h3>
                <p>Frame: {selectedIdx}</p>
                <p>Type: {frames[selectedIdx]?.type}</p>
                <p>Time: {frames[selectedIdx]?.pts_time}s</p>
            </div>

            <div className="macroblock-box">
                <h3>Macroblock Information</h3>
                {frames.length > 0 && selectedIdx < frames.length && (
                    <>
                        <div className="macroblock-placeholder">
                            <p>Macroblock visualization would appear here</p>
                        </div>
                        <div className="macroblock-info">
                            <p>Type: {frames[selectedIdx].type}</p>
                            <p>Time: {frames[selectedIdx].pts_time}s</p>
                        </div>
                    </>
                )}

            </div>
            <div className="frame-preview-right">
                <button
                    className="highlight-macroblock"
                    onClick={handleHighlightClick}
                >
                    Highlight macroblocks
                </button>
                <button
                    className="history-button"
                    onClick={() => handleOnClick(true)}
                >
                    Show macroblock history
                </button>
            </div>
        </div>
    );
};

export default MacroblockInfo;