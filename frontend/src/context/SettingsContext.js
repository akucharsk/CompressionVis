import React, { createContext, useContext, useState } from 'react';

const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
    const [parameters, setParameters] = useState({
        video: null,
        bandwidth: null,
        resolution: null,
        pattern: null,
    });

    return (
        <SettingsContext.Provider value={{ parameters, setParameters }}>
            {children}
        </SettingsContext.Provider>
    );
};
