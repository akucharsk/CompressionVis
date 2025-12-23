import "../../styles/components/charts/CompressionsRank.css";
import { useEffect, useMemo, useState } from "react";
import { AlphaPicker, SketchPicker } from 'react-color';
import { useCharts } from "../../context/ChartsContext";
import Spinner from "../Spinner";
import CompressionsRankField from "./CompressionsRankField";

const CompressionsRank = () => {

    const [orderOfSorting, setOrderOfSorting] = useState("Ascending");
    const [selectedMetric, setSelectedMetric] = useState("VMAF");

    const compareForSort = (video1, video2) => {
        if (!selectedMetric) return 0;
        try {
            const value1 = parseFloat(video1.metrics[selectedMetric.toLowerCase()])
            const value2 = parseFloat(video2.metrics[selectedMetric.toLowerCase()])
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
    const { data, isPending, isFetching, refetch } = compressionsToRank;

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

    const sortedData = useMemo(() => {
        if (!data) return [];
        return [...data].sort(compareForSort);
    }, [data, selectedMetric, orderOfSorting]);


    return (
        <div className="charts-compressions-rank">
            <div className="rank-panel">
                <select
                    value={selectedMetric}
                    onChange={e => setSelectedMetric(e.target.value)}
                >
                    <option value="VMAF">
                        VMAF
                    </option>
                    <option value="SSIM">
                        SSIM
                    </option>
                    <option value="PSNR">
                        PSNR
                    </option>
                    <option value="Size">
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
            {isPending ? (
            <div className="sorted-rank">
                <div className="sorted-rank-column-titles">
                    <div className="column-titles-compression-data">Compression</div>
                    <div className="column-titles-score">{selectedMetric}</div>
                </div>
                <div className="sorted-rank-info">
                    <div className="sorted-rank-info-loading">
                        <Spinner size={60}/>
                    </div>
                </div>
            </div>
            ) : sortedData.length > 0 ? (
            <div className="sorted-rank with-data">
                <div className="sorted-rank-column-titles">
                    <div className="column-titles-compression-data">Compression</div>
                    <div className="column-titles-score">{selectedMetric}</div>
                </div>
                {sortedData.map((video, idx) => {
                    if (!video) return;
                    const areAllMetricsNotReady = Object.entries(video.metrics)
                        .filter(([key]) => key !== "size")
                        .every(([, value]) => value === null || value === "None" || value === 0);
                    const initialMetricsState = areAllMetricsNotReady ? "processing" : "loaded";
                    
                    return (
                        <CompressionsRankField 
                            compression={video} 
                            idx={idx}
                            selectedMetric={selectedMetric}
                            initialMetricsState={initialMetricsState}
                            refetchCompressions={refetch}
                            key={video.id}
                        />
                    );
                })}
            </div>
            ) : (
            <div className="sorted-rank">
                <div className="sorted-rank-column-titles">
                    <div className="column-titles-compression-data">Compression</div>
                    <div className="column-titles-score">{selectedMetric}</div>
                </div>
                <div className="sorted-rank-info">
                    <div className="sorted-rank-info-not-found">
                        No available compressions yet
                    </div>
                </div>
            </div>
            )}
        </div>
    )
}

export default CompressionsRank;