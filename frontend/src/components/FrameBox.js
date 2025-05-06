import React from "react";

const FrameBox = ({selectedIdx, frameSequence, setSelectedIdx}) => {
    return ( 
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
    );
};

export default FrameBox;