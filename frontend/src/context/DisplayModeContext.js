import { createContext, useContext, useState } from "react";

const DisplayModeContext = createContext();

export const useDisplayMode = () => useContext(DisplayModeContext);

export const DisplayModeProvider = ({children}) => {
    const [displayMode, setDisplayMode] = useState("frames");

    return (
        <DisplayModeContext.Provider value={{ 
            displayMode, 
            setDisplayMode
        }}>
            {children}
        </DisplayModeContext.Provider>
    );
}