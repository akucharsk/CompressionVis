import { useEffect, useState } from "react";
import Spinner from "../Spinner";
import RGBPicker from "./RGBPicker";
import { ChartsOptionsFieldQuery } from "../../hooks/ChartsOptionsFieldQuery";

const ChartsOptionsField = ({ isTapped, isInactive, compressionId, compressionMetricState, setCompressionMetricState, initialMetricsState }) => {
    const [fieldState, setFieldState] = useState(initialMetricsState);
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
            className={`compression-in-select-panel ${isTapped === true ? "active-tapped" : isInactive ? "inactive" : "active"}`} 
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
                        compressionMetricState={compressionMetricState}
                        setCompressionMetricState={setCompressionMetricState}
                        compressionId={compressionId}
                        isActive={!isInactive}
                    />
                ) : (
                    <div>Invalid initialMetricsState</div>
                )}
            </div>
        </div>
    );
}

export default ChartsOptionsField;