import { createContext, useContext, useState } from "react";

const DisplayModeContext = createContext();

export const useDisplayMode = () => useContext(DisplayModeContext);

export const DisplayModeProvider = ({children}) => {
    const [displayMode, setDisplayMode] = useState("frames");
    const [hasImageFetched, setHasImageFetched]= useState(false);

    return (
        <DisplayModeContext.Provider value={{ 
            displayMode, 
            setDisplayMode,
            hasImageFetched,
            setHasImageFetched
        }}>
            {children}
        </DisplayModeContext.Provider>
    );
}