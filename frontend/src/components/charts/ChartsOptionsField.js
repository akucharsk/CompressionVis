import "../../styles/components/charts/ChartsOptions.css";
import { useEffect, useState } from "react";
import Spinner from "../Spinner";
import RGBPicker from "./RGBPicker";
import { ChartsOptionsFieldQuery } from "../../hooks/ChartsOptionsFieldQuery";
import { useCharts } from "../../context/ChartsContext";

const ChartsOptionsField = ({ compressionId, initialMetricsState }) => {
    const [fieldState, setFieldState] = useState(initialMetricsState);
    const { setCompressionMetricState, setLeftToTap, compressionMetricState, leftToTap, TAPPED_MAX } = useCharts();
    const { data } = ChartsOptionsFieldQuery(
        compressionId,
        initialMetricsState !== "loaded"
    );

    const isTapped = compressionMetricState[compressionId]?.isTapped || false;
    const isInactive = !isTapped && leftToTap <= 0;

    const toggleTap = (e, id) => {
        e.stopPropagation();
        setCompressionMetricState(prev => {
            const updated = {
                ...prev,
                [id]: {
                    ...prev[id],
                    isTapped: !prev[id].isTapped
                }
            };
            const tappedCount = Object.values(updated).filter(v => v.isTapped).length;
            setLeftToTap(TAPPED_MAX - tappedCount);
            return updated;
        });
    };

    useEffect(() => {
        if (data) {
            const newMessage = data.message;
            setFieldState(
                newMessage === "finished" ? "loaded" : newMessage === "processing" ? "processing" : "error"
            );
        }
    }, [data])


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