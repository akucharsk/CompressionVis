import React from "react";

const MacroblockInfo = ({ frames, selectedIdx, handleOnClick }) => {
    const handleHighlightClick = () => {
        alert("Highlighting macroblocks is not implemented yet.");
    };

    return (
        <div className="right-section">
            <div className="frame-preview-right">
                <button
                    className="highlight-macroblock"
                    onClick={handleHighlightClick}
                >
                    Highlight macroblocks
                </button>
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