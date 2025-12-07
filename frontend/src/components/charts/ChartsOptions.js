import "../../styles/components/charts/ChartsOptions.css";
import { useEffect, useState } from "react";
// import {Menu} from "mui-react-modal";
// import {MenuItem} from "mui/material/MenuItem";
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Spinner from "../Spinner";
import { SketchPicker } from "react-color";

const ChartsOptions = ({ colors, setColors, compressedVideos }) => {

    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);
    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    const [chosenVideo, setChosenVideo] = useState(null);

    const changeColor = (color) => {
        setColors(prev => {
            const updated = {... prev};

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

    const toggleTap = (id) => {
        setColors(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                isTapped: !prev[id].isTapped
            }
        }));
    };

    useEffect(() => {
        setColors(prev => {
            const updated = {... prev};

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


    return (
        <div className="charts-options">
            {/* <div className="charts-scene-threshold">
                threshold
            </div> */}
            {compressedVideos.map((compressionId, idx) => (
                <div 
                    className={`compression-in-select-panel ${compressionId === 0 ? "disactive" : colors[compressionId]?.isTapped ? "active-tapped" : "active"}`} 
                    key={idx}
                    // onClick={toggleTap(compressionId)}
                >
                    <div className="selection-option-left">
                        <div>Compression {compressionId}</div>
                    </div>
                    <div className="selection-option-right">
                        {compressionId === 0 ? (
                            <Spinner size={16}/>
                        ) : (
                        <>
                            <div className={`metric-color-picker`} style={{backgroundColor: colors[compressionId]?.color}} onClick={(e) => {
                                setChosenVideo(compressionId);                                
                                handleClick(e);
                            }
                            }></div>
                            <Menu
                                id="basic-menu"
                                anchorEl={anchorEl}
                                open={open}
                                onClose={handleClose}
                                slotProps={{
                                list: {
                                    'aria-labelledby': 'basic-button',
                                },
                                }}
                            >
                                <SketchPicker
                                    color={colors[compressionId]?.color}
                                    onChangeComplete={(color) => {
                                        setColors(prev => ({
                                            ...prev,
                                            [chosenVideo]: {
                                                ...prev[chosenVideo],
                                                color: color.hex
                                            }
                                        }))
                                    }}
                                />
                            </Menu>
                        </>
                        )}
                    </div>
                    {console.log(colors)}
                </div>
            ))}
        </div>
    )
}

export default ChartsOptions;