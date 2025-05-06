import React from "react";

const FrameBox = ({selectedIdx, frameSequence, setSelectedIdx}) => {
    return ( 
        <>
            <div className="time-labels">
                        {Array.from({length: 21}, (_, i) => (
                            <div key={i} className="time-label">{(i * 0.1).toFixed(1)}</div>
                        ))}
                    </div>
            <div className="frameBox">
                {frameSequence.map((type, idx) => (
                    <div
                        key={idx}
                        className={`frame ${type} ${selectedIdx === idx ? 'selected' : ''}`}
                        onClick={() => setSelectedIdx(idx)}
                    >
                        {type}
                    </div>
                ))}
            </div>
        </>
    );
};

export default FrameBox;