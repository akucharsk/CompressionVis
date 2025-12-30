import "../../styles/components/charts/ChartsOptions.css";
import { useEffect, useState } from "react";
import Spinner from "../Spinner";
import RGBPicker from "./RGBPicker";
import { useCharts } from "../../context/ChartsContext";
import ChartsOptionsField from "./ChartsOptionsField";
import { DEFAULT_COLOR } from "../../utils/constants";


const ChartsOptions = () => {

    const { compressionsToTap, selectedVideoId, compressionMetricState, setCompressionMetricState, leftToTap, setLeftToTap, TAPPED_MAX } = useCharts();
    const { data, isFetching } = compressionsToTap;

    const changeColor = (color) => {
        setCompressionMetricState(prev => {
            const updated = {...prev};

            data.forEach(video => {
                const compressionId = video.id;
                if (!updated[compressionId]) {
                    updated[compressionId] = {
                        isTapped: false,
                        color: DEFAULT_COLOR
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
                        color: DEFAULT_COLOR,
                        originalVideoId: selectedVideoId 
                    }
                }
            });

            return updated;
        });

    }, [selectedVideoId, data]);


    return (
        <>
            {isFetching && selectedVideoId ? (
                <div className="charts-options">
                    <div className="charts-options-info">
                        <Spinner size={60}/>
                    </div>
                </div>
            ) : !selectedVideoId ? (
                <div className="charts-options">
                    <div className="charts-options-info">
                        Choose base video
                    </div>
                </div>
            ) : data ? (
                <div className="charts-options with-data">
                    {data.map((video, idx) => {
                        return (
                            <ChartsOptionsField 
                                compressionId={video.id}
                                metrics={video.metrics}
                                key={video.id}
                            />
                        )    
                    })}
                </div>
            ) : (
                <div className="charts-options">
                    <div className="charts-options-info">
                        No available compressions of chosen video yet
                    </div>
                </div>
            )}
        </>
    )
}

export default ChartsOptions;