import React, { createContext, useContext, useState } from "react";

const FramesContext = createContext();

export const useFrames = () => useContext(FramesContext);

export const FramesProvider = ({ children }) => {
    const [frames, setFrames] = useState([]);
    const [frameMetrics, setFrameMetrics] = useState([]);
    const [selectedIdx, setSelectedIdx] = useState(0);
    const frameSizes = frames.map(frame => frame.pkt_size);
    const min = Math.min.apply(Array, frameSizes);
    const max = Math.max.apply(Array, frameSizes);

    const sizeRange = { min, max };
    console.log(sizeRange);

    return (
        <FramesContext.Provider value={{ frames, setFrames, selectedIdx, setSelectedIdx, sizeRange, frameMetrics, setFrameMetrics }}>
            { children }
        </FramesContext.Provider>
    );
};
