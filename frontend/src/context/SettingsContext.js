import React, { createContext, useContext, useState } from 'react';

const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
    const [parameters, setParameters] = useState({
        videoLink: null,
        videoName: null,
        videoId: null,
        bandwidth: null,
        resolution: null,
        gop: null,
        crf: null,
        framerate: null,
    });

    return (
        <SettingsContext.Provider value={{ parameters, setParameters }}>
            {children}
        </SettingsContext.Provider>
    );
};
