import { createContext, useContext, useState } from "react";

const FpsContext = createContext();

export const useFps = () => useContext(FpsContext);

export const FpsProvider = ({ children }) => {
    const [fps, setFps] = useState(30);

    return (
        <FpsContext.Provider value={{ fps, setFps }}>
            { children }
        </FpsContext.Provider>
    )
}