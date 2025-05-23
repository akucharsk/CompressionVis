import React from "react";

const getFrameImageUrl = (selectedIdx, frames) => {
    if (frames.length > 0 && selectedIdx < frames.length) {
        return `http://127.0.0.1:8000${frames[selectedIdx].image_url}`;
    }
    return null;
};

const Frame = ({ frames, selectedIdx}) => (
    <div className="left-section">
        {frames.length > 0 && selectedIdx < frames.length && (
            <div className="frame-preview">
                <img
                    src={getFrameImageUrl(selectedIdx, frames)}
                    alt={`Frame ${selectedIdx} (${frames[selectedIdx].type})`}
                />
                <div className="frame-info">
                    <p>Frame: {selectedIdx}</p>
                    <p>Type: {frames[selectedIdx].type}</p>
                    <p>Time: {frames[selectedIdx].pts_time}s</p>
                </div>
            </div>
        )}
    </div>
);


export default Frame;
