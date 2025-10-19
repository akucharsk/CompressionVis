import { createContext } from "react";

const VideoPlayingContext = createContext(null);

export const useVideoPlaying = () => useContext(VideoPlayingContext);

export const VideoPlayingProvider = ({ children }) => {
    const [isVideoPlaying, setIsVideoPlaying] = useState(false);

    return (
        <VideoPlayingContext.Provider values={{
            isVideoPlaying,
            setIsVideoPlaying
        }}>
            {children}
        </VideoPlayingContext.Provider>
    );
}