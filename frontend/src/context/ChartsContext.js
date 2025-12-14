import { useQuery } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect } from "react"
import { genericFetch } from "../api/genericFetch";
import { apiUrl } from "../utils/urls";
import { useSearchParams } from "react-router-dom";
import { defaultRefetchIntervalPolicy } from "../utils/retryUtils";


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

    const compressionsToTapFn = async (id) => {
        const data = await genericFetch(`${apiUrl}/metrics/metrics-rank?originalVideoId=${id}`);
        return data["videos"];
    };

    const compressionsToRankFn = async () => {
        // console.log("compressions")
        const data = await genericFetch(`${apiUrl}/metrics/metrics-rank/`);
        return data["videos"];
    }

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

    const compressionsToRank = useQuery({
        queryKey: ["compressionsToRank"],
        queryFn: compressionsToRankFn
    })

    // Added to force reload while changing base video in SelectForVideo
    useEffect(() => {
        const {refetch} = compressionsToTap;
        refetch();
    }, [selectedVideoId])

    return (
        <ChartsContext.Provider value={{ thumbnails, compressionsToTap, compressionsToRank, selectedVideoId, changeVideo }}>
            { children }
        </ChartsContext.Provider>
    )
}