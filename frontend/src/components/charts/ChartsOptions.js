import "../../styles/components/charts/ChartsOptions.css";
import { useEffect, useState } from "react";
// import {Menu} from "mui-react-modal";
// import {MenuItem} from "mui/material/MenuItem";
// import Menu from '@mui/material/Menu';
// import MenuItem from '@mui/material/MenuItem';
import Spinner from "../Spinner";
import { SketchPicker } from "react-color";
import RGBPicker from "./RGBPicker";

const ChartsOptions = ({ compressionMetricState, setCompressionMetricState, compressedVideos }) => {

    const changeColor = (color) => {
        setCompressionMetricState(prev => {
            const updated = {...prev};

            compressedVideos.forEach(compressionId => {
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
        setCompressionMetricState(prev => {
            const updated = {...prev};

            compressedVideos.forEach(compressionId => {
                if (!updated[compressionId]) {
                    updated[compressionId] = {
                        isTapped: false,
                        color: "fff"
                    }
                }
            });

            return updated;
        })        
    }, [compressedVideos]);

    console.log(compressionMetricState)

    return (
        <div className="charts-options">
            {/* <div className="charts-scene-threshold">
                threshold
            </div> */}
            {compressedVideos.map((compressionId, idx) => (
                <div 
                    className={`compression-in-select-panel ${compressionId === 0 ? "disactive" : compressionMetricState[compressionId]?.isTapped === true ? "active-tapped" : "active"}`} 
                    key={idx}
                    onClick={(e) => toggleTap(e, compressionId)}
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
                            />
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}

export default ChartsOptions;