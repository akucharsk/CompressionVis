import { useQuery } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect } from "react"
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

    // const compressionsToTapFn = useCallback(async (id) => {
    //     console.log("ID", id);
    //     const url = id 
    //     ? `${apiUrl}/metrics/metrics-rank?originalVideoId=${id}`
    //     : `${apiUrl}/metrics/metrics-rank`;
    //     const data = await genericFetch(url);
    //     console.log("CO TU MAMY", data)
    //     return data["videos"];
    // }, [])

    const compressionsToTapFn = async (id) => {
        const data = await genericFetch(`${apiUrl}/metrics/metrics-rank?originalVideoId=${id}`);
        return data["videos"];
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

    const compressionsToTap = useQuery({
        queryKey: ["compressionsToTap", selectedVideoId],
        queryFn: () => compressionsToTapFn(selectedVideoId),
    })

    // Added to force reload while changing base video in SelectForVideo
    useEffect(() => {
        const {refetch} = compressionsToTap;
        refetch();
    }, [selectedVideoId])

    return (
        <ChartsContext.Provider value={{ thumbnails, compressionsToTap, selectedVideoId, changeVideo }}>
            { children }
        </ChartsContext.Provider>
    )
}

console.log("Charts poroviver export", ChartsProvider);
