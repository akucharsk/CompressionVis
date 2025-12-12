import { useQuery } from "@tanstack/react-query";
import { createContext, useCallback, useContext } from "react"
import { genericFetch } from "../api/genericFetch";
import { apiUrl } from "../utils/urls";
import { useSearchParams } from "react-router-dom";

const ChartsContext = createContext();

export const useCharts = () => useContext(ChartsContext);

export const ChartsProvider = ({ children }) => {
    
    const [searchParams, setSearchParams] = useSearchParams();

    const selectedVideoId = searchParams.get("originalVideoId");
    const changeVideo = (newSelectedVideoId) => {
        setSearchParams(prev => {
            prev.set("originalVideoId", newSelectedVideoId);
            return prev;
        })
    };

    const thumbnailsFn = useCallback(async () => {
        const data = await genericFetch(`${apiUrl}/video/example/`);
        const formattedData = data["videoIds"].map((item) => ({
            id: item.id,
            name: item.title,
            thumbnail: `${apiUrl}/video/thumbnail/${item.id}`
        }))
        return formattedData;
    }, []);
    
    const thumbnails = useQuery({
        queryKey: ['thumbnails'],
        queryFn: thumbnailsFn
    });

    return (
        <ChartsContext.Provider value={{ thumbnails, selectedVideoId, changeVideo }}>
            { children }
        </ChartsContext.Provider>
    )
}