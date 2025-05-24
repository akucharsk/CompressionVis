import React, { createContext, useContext, useState } from 'react';

const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
    const [parameters, setParameters] = useState({
        videoLink: "http://127.0.0.1:8000/video/example1.mp4",
        videoName: "example1.mp4",
        compressedFilename: null,
        bandwidth: null,
        resolution: null,
        pattern: null,
        crf: null,
    });

    return (
        <SettingsContext.Provider value={{ parameters, setParameters }}>
            {children}
        </SettingsContext.Provider>
    );
};
