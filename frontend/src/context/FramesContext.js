import React, { createContext, useContext, useState } from "react";

const FramesContext = createContext();

export const useFrames = () => useContext(FramesContext);

export const FramesProvider = ({ children }) => {
    const [frames, setFrames] = useState([]);
    const [selectedIdx, setSelectedIdx] = useState(0);

    return (
        <FramesContext.Provider value={{ frames, setFrames, selectedIdx, setSelectedIdx }}>
            {children}
        </FramesContext.Provider>
    );
};