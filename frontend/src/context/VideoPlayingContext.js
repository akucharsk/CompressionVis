import { createContext, useContext, useState } from "react";

const VideoPlayingContext = createContext(null);

export const useVideoPlaying = () => useContext(VideoPlayingContext);

export const VideoPlayingProvider = ({ children }) => {
    const [isVideoPlaying, setIsVideoPlaying] = useState(false);

    return (
        <VideoPlayingContext.Provider value={{
            isVideoPlaying,
            setIsVideoPlaying
        }}>
            {children}
        </VideoPlayingContext.Provider>
    );
}