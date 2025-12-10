import "../../styles/components/charts/ChartsOptions.css";

// import Menu from "@mui/material/Menu";
// import Popover from "@mui/material/Popover";
import { useState } from "react";
import { SketchPicker } from "react-color";
import * as Popover from "@radix-ui/react-popover";


const RGBPicker = ({ compressionMetricState, setCompressionMetricState, compressionId }) => {

    const [anchorEl, setAnchorEl] = useState(null);
    const [chosenVideo, setChosenVideo] = useState(null);
    const open = Boolean(anchorEl);
    
    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    const sketchpickerDarkStyling = {
        default: {
            picker: {
                backgroundColor: "#2a2a2a",
                border: "#626262 2px solid",
                fontColor: "#fff"
            },
            
        },
        label: {
            color: "#fff"
        }
    }

    return (
        <Popover.Root>
            <Popover.Trigger asChild>
                <div 
                    className={`metric-color-picker`} 
                    style={{backgroundColor: compressionMetricState[compressionId]?.color}} 
                    onClick={(e) => {
                        e.stopPropagation();
                        setChosenVideo(compressionId);
                    }}>
                </div>
            </Popover.Trigger>
            <Popover.Portal>
                <Popover.Content 
                    sideOffset={8}
                    align="start"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div>
                        <SketchPicker
                            styles={sketchpickerDarkStyling}
                            color={compressionMetricState[compressionId]?.color}
                            onChangeComplete={(color) => {
                                setCompressionMetricState(prev => ({
                                    ...prev,
                                    [chosenVideo]: {
                                        ...prev[chosenVideo],
                                        color: color.hex
                                    }
                                }))
                            }}
                        />
                    </div>
                </Popover.Content>
            </Popover.Portal>
        </Popover.Root>
    )
}

export default RGBPicker;