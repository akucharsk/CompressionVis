import "../../styles/components/charts/ChartsOptions.css";
import { useEffect, useState } from "react";
import Spinner from "../Spinner";
import RGBPicker from "./RGBPicker";
import { useCharts } from "../../context/ChartsContext";
import ChartsOptionsField from "./ChartsOptionsField";


const ChartsOptions = ({ compressionMetricState, setCompressionMetricState }) => {

    const TAPPED_MAX = 5;
    const [leftToTap, setLeftToTap] = useState(TAPPED_MAX); 
    const { compressionsToTap, selectedVideoId } = useCharts();
    const { data, isFetching, refetch } = compressionsToTap;

    const changeColor = (color) => {
        setCompressionMetricState(prev => {
            const updated = {...prev};

            data.forEach(video => {
                const compressionId = video.id;
                if (!updated[compressionId]) {
                    updated[compressionId] = {
                        isTapped: false,
                        color: "fff"
                    }
                }
            });

            return updated;
        })
    }

    useEffect(() => {
        if (!data) return;
        setCompressionMetricState(prev => {
            const updated = {...prev};

            data.forEach(video => {
                const compressionId = video.id;
                if (!updated[compressionId]) {
                    updated[compressionId] = {
                        isTapped: false,
                        color: "fff"
                    }
                }
            });

            return updated;
        });

    }, [selectedVideoId, data]);

    useEffect(() => {
        // console.log(compressionMetricState[1])
        const tapped = Object.keys(compressionMetricState).filter(item => compressionMetricState[item]?.isTapped).length
            
        setLeftToTap(TAPPED_MAX - tapped);
        // console.log(tapped);
    }, [compressionMetricState])


    return (
        <div className="charts-options">
            {isFetching ? (
                <Spinner size={20}/>
            ) : !selectedVideoId ? (
                <div>
                    Choose base video
                </div>
            ) : data ? (          
                data.map((video, idx) => {
                    // console.log("wideo i idx", video, idx);
                    const compressionId = video.id;
                    const isTapped = compressionMetricState[compressionId]?.isTapped;
                    const isInactive = isTapped ? false : leftToTap > 0 ? false : true;
                    // const stateFromFirstFetch = video.metrics.every(function(i) { return i === "None" || i === "null"; });
                    // const initialMetricsState = 
                    //     Object.values(video.metrics).includes(null) || Object.values(video.metrics).includes("None") ? "not-loaded" : "loaded";
                    console.log("metryki", video, video.metrics);
                    const areAllMetricsNull = Object.entries(video.metrics)
                        .filter(([key]) => key !== "size")
                        .every(([, value]) => value === null || value === "None");
                    const initialMetricsState = areAllMetricsNull ? "processing" : "loaded";

                    return (
                        <ChartsOptionsField 
                            isTapped={isTapped}
                            isInactive={isInactive}
                            compressionId={compressionId}
                            compressionMetricState={compressionMetricState}
                            setCompressionMetricState={setCompressionMetricState}
                            initialMetricsState={initialMetricsState}
                        />
                    )    
                })
            ) : (
                <div>No compressions of chosen video yet</div>
            )}
        </div>
    )
}

export default ChartsOptions;