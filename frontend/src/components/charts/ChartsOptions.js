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

    const TAPPED_MAX = 5;
    const [leftToTap, setLeftToTap] = useState(TAPPED_MAX); 

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
        });

    }, [compressedVideos]);

    useEffect(() => {
        console.log(compressionMetricState[1])
        // console.log(compressionMetricState[1]?.isTapped)
        const tapped = Object.keys(compressionMetricState).filter(item => compressionMetricState[item]?.isTapped).length
            
        setLeftToTap(TAPPED_MAX - tapped);
        console.log(tapped);
    }, [compressionMetricState])

    console.log(compressionMetricState);

    return (
        <div className="charts-options">
            {compressedVideos.map((compressionId, idx) => {
                const isTapped = compressionMetricState[compressionId]?.isTapped;
                const isInactive = isTapped ? false : leftToTap > 0 ? false : true;

                return (

                    <div 
                        className={`compression-in-select-panel ${isTapped === true ? "active-tapped" : isInactive ? "inactive" : "active"}`} 
                        key={idx}
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
            })}
        </div>
    )
}

export default ChartsOptions;