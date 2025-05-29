import React from "react";
import {getFrameImageUrl} from "../../utils/urls";

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
                    <p>Size: {`${frames[selectedIdx].pkt_size}B`}</p>
                </div>
            </div>
        )}
    </div>
);


export default Frame;
