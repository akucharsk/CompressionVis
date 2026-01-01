import { useEffect, useMemo, useState } from "react";
import { useCharts } from "../../context/ChartsContext";
import { useChartsOptionsFieldQuery } from "../../hooks/charts-options-field-query";
import Spinner from "../Spinner";
import { sizeFormatter } from "../../utils/sizeFormatter";

const CompressionsRankField = ({ compression, selectedMetric, refetchCompressions }) => {
    const { id, original, metrics, ...details } = compression;

    const initialMetricsState = useMemo(() => (
        Object.entries(metrics)
            .filter(([key]) => key !== "size")
            .every(([, value]) => value === null || value === "None" || value === 0) 
            ? "processing" 
            : "loaded"
    ), [metrics])
    
    const [fieldState, setFieldState] = useState(initialMetricsState);
    const [open, setOpen] = useState(false);
    const { thumbnails } = useCharts();

    const { data } = useChartsOptionsFieldQuery(
        id,
        initialMetricsState !== "loaded"
    )

    const getTitleOfOriginal = (compressionId) => {
        const originalVideo = thumbnails.data?.find((video) => video.id === compressionId);
        if (originalVideo) return originalVideo.name;
        return "Not found";
    }

    useEffect(() => {
        if (!data) return;

        if (data.message === "finished") {
            setFieldState("loaded");
            refetchCompressions();
        } else if (data.message === "processing") {
            setFieldState("processing");
        } else {
            setFieldState("error");
    }
    }, [data, refetchCompressions])
    
    const metricKey = selectedMetric.toLowerCase();
    const value = metrics?.[metricKey];
    

    return (
        <div className={`compression-in-rank-panel ${fieldState !== "loaded" ? "inactive" : "active"}`}>
            <div className={`compression-main-info ${open ? "open" : ""}`} onClick={() => {setOpen(!open)}}>
                <div className="compression-main-info-descriptive">
                    <div className="compression-main-info-descriptive-id">Compression {id}</div>
                    <div className="compression-main-info-descriptive-title">{getTitleOfOriginal(original)}</div>
                    <div className="compression-main-info-descriptive-time">{details.created_at ?? "Creation time..."}</div>
                </div>
                <div className="compression-main-info-numerical">
                    {fieldState !== "loaded" || !value ? (
                        <Spinner size={20}/>
                    ) : (
                    <span>
                        {metricKey === "size" ? sizeFormatter(value) : value.toFixed(2)}
                    </span>
                    )}
                </div>
            </div>
            <div className={`compression-details ${open ? "open" : ""}`}>
                <div className="compression-details-inner">
                    {Object.entries(details)
                    .filter(([key,]) => key !== "created_at")
                    .map(([key, value]) => {
                        return (
                            <div className="compression-details-element" key={key}>
                                <div className="compression-details-element-left">{key}:</div> 
                                <div className="compression-details-element-right">{value ? value : "- -"}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default CompressionsRankField;