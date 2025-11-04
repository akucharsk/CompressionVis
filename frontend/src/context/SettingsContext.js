import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
    const [parameters, setParameters] = useState(() => {
        const saved = localStorage.getItem('settings');
        return saved
            ? JSON.parse(saved)
            : {
                videoLink: null,
                videoName: null,
                videoId: null,
                resolution: null,
                gop: null,
                crf: null,
                preset: null,
                bFrames: null,
                aqMode: null,
                aqStrength: null,
                qualityType: null,
                mode: null,
                resultingSize: null,
            };
    });

    // zapisuj dane do localStorage przy każdej zmianie
    useEffect(() => {
        localStorage.setItem('settings', JSON.stringify(parameters));
    }, [parameters]);

    // funkcja do czyszczenia np. przy wylogowaniu
    const clearSettings = () => {
        localStorage.removeItem('settings');
        setParameters({
            videoLink: null,
            videoName: null,
            videoId: null,
            resolution: null,
            gop: null,
            crf: null,
            preset: null,
            bFrames: null,
            aqMode: null,
            aqStrength: null,
            qualityType: null,
            mode: null,
            resultingSize: null,
        });
    };

    return (
        <SettingsContext.Provider value={{ parameters, setParameters, clearSettings }}>
            {children}
        </SettingsContext.Provider>
    );
};
