import { useEffect, useState } from "react";
import { useCharts } from "../../context/ChartsContext";
import { ChartsOptionsFieldQuery } from "../../hooks/ChartsOptionsFieldQuery";
import Spinner from "../Spinner";

const CompressionsRankField = ({ compression, idx, selectedMetric, initialMetricsState, refetchCompressions }) => {
    const [fieldState, setFieldState] = useState(initialMetricsState);
    const [open, setOpen] = useState(false);
    const { thumbnails } = useCharts();
    const { id, original, metrics, ...details } = compression;

    const { data } = ChartsOptionsFieldQuery(
        id,
        initialMetricsState !== "loaded"
    )

    const getTitleOfOriginal = (compressionId) => {
        const originalVideo = thumbnails.data?.find((video) => video.id === compressionId);
        if (originalVideo) return originalVideo.name;
        return "Not found";
    }

    useEffect(() => {
        // if (data) {
        //     const newMessage = data.message;
        //     setFieldState(
        //         newMessage === "finished" ? "loaded" : newMessage === "processing" ? "processing" : "error"
        //     );
        // }
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
    
    return (
        <div className={`compression-in-rank-panel ${fieldState !== "loaded" ? "inactive" : "active"}`} key={idx}>
            <div className={`compression-main-info ${open ? "open" : ""}`} onClick={() => {setOpen(!open)}}>
                <div className="compression-main-info-descriptive">
                    <div className="compression-main-info-descriptive-id">Compression {id}</div>
                    <div className="compression-main-info-descriptive-title">{getTitleOfOriginal(original)}</div>
                    <div className="compression-main-info-descriptive-time">Czas utworzenia</div>
                </div>
                <div className="compression-main-info-numerical">
                    {fieldState !== "loaded" ? (
                        <Spinner size={20}/>
                    ) : (
                    <span>
                        {Object.keys(metrics)
                            .filter(item => item === selectedMetric.toLowerCase())
                            .map(key => {
                                return (Math.round(metrics[key]) / 100).toFixed(2);
                            })
                        }
                    </span>)
                    }
                </div>
            </div>

                    {/* poprawić Bajty na najwieksza wartość */}

            <div className={`compression-details ${open ? "open" : ""}`}>
                <div className="compression-details-inner">
                    {Object.entries(details).map(([key, value, dIdx]) => {
                        return (
                            <div className="compression-details-element" key={dIdx}>
                                <div>{key}: {value}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default CompressionsRankField;