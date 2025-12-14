import "../../styles/components/charts/CompressionsRank.css";
import { useEffect, useState } from "react";
import { AlphaPicker, SketchPicker } from 'react-color';
import { useCharts } from "../../context/ChartsContext";
import Spinner from "../Spinner";

const CompressionsRank = () => {

    const [orderOfSorting, setOrderOfSorting] = useState("Ascending");
    const [selectedMetric, setSelectedMetric] = useState("vmaf");

    const compareForSort = (video1, video2) => {
        if (!selectedMetric) return 0;
        try {
            const value1 = parseFloat(video1.metrics[selectedMetric])
            const value2 = parseFloat(video2.metrics[selectedMetric])
            if (orderOfSorting === "Ascending") {
                if (value1 < value2) {
                    return -1;
                } else if (value1 > value2) {
                    return 1
                }
            } else if (orderOfSorting === "Descending") {
                if (value1 > value2) {
                    return -1;
                } else if (value1 < value2) {
                    return 1
                }
            }
            return 0;
        } catch (e) {
            console.log("Error in parsing!", e)
            return 0;
        }
    }

    const { compressionsToRank, thumbnails } = useCharts();
    const { data, isFetching } = compressionsToRank;
    const [sortedData, setSortedData] = useState(data ? [...data].sort(compareForSort) : []);

    const getTitleOfOriginal = (compressionId) => {
        const originalVideo = thumbnails.data.find((video) => video.id === compressionId);
        if (originalVideo) return originalVideo.name;
        return "Not found";
    }

    const handleAscendingButton = () => {
        if (orderOfSorting === "Descending") {
            setOrderOfSorting("Ascending");
        }
    }

    const handleDescendingButton = () => {
        if (orderOfSorting === "Ascending") {
            setOrderOfSorting("Descending");
        }
    }    

    useEffect(() => {
        setSortedData(prev => {
            const newSorted = [...prev].sort(compareForSort);
            return newSorted
        })
    }, [selectedMetric, orderOfSorting])

    useEffect(() => {
        let newSorted = [];
        if (data) {
            newSorted = [...data].sort(compareForSort);
        }
        setSortedData(newSorted);
    }, [isFetching])


    return (
        <div className="charts-compressions-rank">
            <div className="rank-panel">
                <select
                    value={selectedMetric}
                    onChange={e => setSelectedMetric(e.target.value)}
                >
                    <option value="vmaf">
                        VMAF
                    </option>
                    <option value="ssim">
                        SSIM
                    </option>
                    <option value="psnr">
                        PSNR
                    </option>
                    <option value="size">
                        Size
                    </option>
                </select>
                <div className="rank-sorting-container">
                    <button 
                        onClick={handleAscendingButton}
                        className={`order-button ${orderOfSorting === "Ascending" ? "active" : ""}`}    
                    >
                        Ascending
                    </button>
                    <button 
                        onClick={handleDescendingButton} 
                        className={`order-button ${orderOfSorting === "Descending" ? "active" : ""}`}
                    >
                        Descending
                    </button>
                </div>
            </div>
            <div className="sorted-rank">
                {isFetching ? (
                    <Spinner size={20}/>
                ) : sortedData.length > 0 ? (
                    sortedData.map((video, idx) => {
                        if (!video) return;
                        return (
                            <>
                            <div>{video.id}</div>
                            <div>{getTitleOfOriginal(video.original)}</div>
                            <div>{Object.keys(video.metrics)
                                    .filter(item => item === selectedMetric)
                                    .map(key => {
                                        return video.metrics[key]
                                    })}</div>
                            </>
                        );
                    })
                ) : (
                    <div>
                        No compressions yet
                    </div>
                )}
            </div>
        </div>
    )
}

export default CompressionsRank;