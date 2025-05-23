import React from "react";

const MacroblockHistory = ({ frames, selectedIdx, handleOffClick }) => (
    <div className="modal-overlay" onClick={handleOffClick}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Macroblock History</h2>
            {frames.length > 0 && (
                <div className="history-content">
                    <p>Frame {selectedIdx} ({frames[selectedIdx].type}) history:</p>
                    <ul>
                        <li>First appearance: Frame 0</li>
                        <li>Last modified: Frame {Math.max(0, selectedIdx - 1)}</li>
                        <li>Reference count: {frames[selectedIdx].type === 'B' ? 2 : 1}</li>
                    </ul>
                </div>
            )}
            <button onClick={() => handleOffClick(false)}>Close</button>
        </div>
    </div>
);


export default MacroblockHistory;
