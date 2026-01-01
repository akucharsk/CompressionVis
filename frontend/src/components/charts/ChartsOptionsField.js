import "../../styles/components/charts/ChartsOptions.css";
import { useEffect, useMemo, useState } from "react";
import Spinner from "../Spinner";
import RGBPicker from "./RGBPicker";
import { useChartsOptionsFieldQuery } from "../../hooks/charts-options-field-query";
import { useCharts } from "../../context/ChartsContext";
import { DEFAULT_COLOR } from "../../utils/constants";

const ChartsOptionsField = ({ compressionId, metrics }) => {
    const initialMetricsState = useMemo(() => (
        Object.entries(metrics)
            .filter(([key]) => key !== "size")
            .every(([, value]) => value === null || value === "None") 
            ? "processing" 
            : "loaded"
        ), [metrics])

    const { setCompressionMetricState, compressionMetricState, tappedCountForCompression, setTappedCountForCompression, TAPPED_MAX, selectedVideoId } = useCharts();
    const { data } = useChartsOptionsFieldQuery(
        compressionId,
        initialMetricsState !== "loaded"
    );

    const isTapped = compressionMetricState[compressionId]?.isTapped || false;
    const isInactive = !isTapped && tappedCountForCompression[selectedVideoId] <= 0;

    const toggleTap = (e, id) => {
        e.stopPropagation();
        setCompressionMetricState(prev => {
            const updated = {
                ...prev,
                [id]: {
                    ...(prev[id] ?? {}),
                    isTapped: !prev[id].isTapped,
                    color: prev[id]?.color ?? DEFAULT_COLOR
                }
            };
            const tappedForThisVideoCount = Object.values(updated).filter(v => v.isTapped && v.originalVideoId === selectedVideoId).length;
            setTappedCountForCompression(prev => ({
                ...prev,
                [selectedVideoId]: TAPPED_MAX - tappedForThisVideoCount
            }))
            return updated;
        });
    };

    const fieldState = !data ? initialMetricsState : data?.message === "finished" ? "loaded" : data?.message === "processing" ? "processing" : "error";


    return (
        <div 
            className={`compression-in-select-panel ${fieldState !== "loaded" || isInactive ? "inactive" : isTapped === true ? "active-tapped" : "active"}`} 
            onClick={(e) => 
                toggleTap(e, compressionId)
            }
        >
            <div className="selection-option-left">
                <div>Compression {compressionId}</div>
            </div>
            <div className="selection-option-right">
                {fieldState === "processing" ? (
                    <Spinner size={16}/>
                ) : fieldState === "loaded" ? (
                    <RGBPicker
                        compressionId={compressionId}
                        isActive={!isInactive}
                    />
                ) : (
                    <div>❌</div>
                )}
            </div>
        </div>
    );
}

export default ChartsOptionsField;