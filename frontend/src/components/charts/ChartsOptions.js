import "../../styles/components/charts/ChartsOptions.css";
import { useEffect, useState } from "react";
import Spinner from "../Spinner";
import RGBPicker from "./RGBPicker";
import { useCharts } from "../../context/ChartsContext";


const ChartsOptions = ({ compressionMetricState, setCompressionMetricState, compressedVideos }) => {

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

    // console.log(compressionMetricState);

    // if (isFetching) {
    //     return <Spinner size={20}/>
    // }

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
                    // Jeszcze to czy sie zaladowalo
                    const isInactive = isTapped ? false : leftToTap > 0 ? false : true;

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
                                {compressionId === 0 ? (
                                    <Spinner size={16}/>
                                ) : (
                                    <RGBPicker 
                                        compressionMetricState={compressionMetricState}
                                        setCompressionMetricState={setCompressionMetricState}
                                        compressionId={compressionId}
                                        isActive={!isInactive}
                                    />
                                )}
                            </div>
                        </div>
                    )    
                })
            ) : (
                <div>No compressions of chosen video yet</div>
            )}
        </div>
    )
}

export default ChartsOptions;