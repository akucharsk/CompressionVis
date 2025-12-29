import "../../styles/components/charts/ChartsOptions.css";
import { useEffect, useState } from "react";
import Spinner from "../Spinner";
import RGBPicker from "./RGBPicker";
import { useChartsOptionsFieldQuery } from "../../hooks/ChartsOptionsFieldQuery";
import { useCharts } from "../../context/ChartsContext";
import { DEFAULT_COLOR } from "../../utils/constants";

const ChartsOptionsField = ({ compressionId, initialMetricsState }) => {
    // const [fieldState, setFieldState] = useState(initialMetricsState);
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
            const tappedForThisVideoCount = Object.values(updated).filter(v => v.isTapped).length;
            setTappedCountForCompression(prev => ({
                ...prev,
                [selectedVideoId]: TAPPED_MAX - tappedForThisVideoCount
            }))
            return updated;
        });
    };

    // useEffect(() => {
    //     if (data) {
    //         const newMessage = data.message;
    //         setFieldState(
    //             newMessage === "finished" ? "loaded" : newMessage === "processing" ? "processing" : "error"
    //         );
    //     }
    // }, [data])
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