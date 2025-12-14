import "../../styles/components/charts/ChartsOptions.css";
import { useState } from "react";
import { SketchPicker } from "react-color";
import * as Popover from "@radix-ui/react-popover";
import { useCharts } from "../../context/ChartsContext";


const RGBPicker = ({ compressionId, isActive }) => {

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

    const { compressionMetricState, setCompressionMetricState } = useCharts();
    const [chosenVideo, setChosenVideo] = useState(null);


    return (
        <Popover.Root>
            <Popover.Trigger asChild>
                <div 
                    className={`metric-color-picker`} 
                    style={{backgroundColor: isActive ? compressionMetricState[compressionId]?.color : "#444",
                        borderColor: isActive ? "#fff" : "#626262"
                    }} 
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