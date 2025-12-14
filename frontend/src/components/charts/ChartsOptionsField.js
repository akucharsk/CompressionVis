import "../../styles/components/charts/ChartsOptions.css";
import { useEffect, useState } from "react";
import Spinner from "../Spinner";
import RGBPicker from "./RGBPicker";
import { ChartsOptionsFieldQuery } from "../../hooks/ChartsOptionsFieldQuery";
import { useCharts } from "../../context/ChartsContext";

const ChartsOptionsField = ({ isTapped, isInactive, compressionId, initialMetricsState }) => {
    const [fieldState, setFieldState] = useState(initialMetricsState);
    const { setCompressionMetricState } = useCharts();
    const { data } = ChartsOptionsFieldQuery(
        compressionId,
        initialMetricsState !== "loaded"
    );

    const toggleTap = (e, id) => {
        e.stopPropagation();
        setCompressionMetricState(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                isTapped: !prev[id].isTapped
            }
        }));
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
            key={compressionId}
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