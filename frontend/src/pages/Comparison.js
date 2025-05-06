import FrameBox from "../components/FrameBox";
import { useState } from "react";
import { frameSequence } from "./data/FrameSequences";
import ImageBlockConst from "../components/ImageBlockConst";
import ImageBlockSelect from "../components/ImageBlockSelect";

const Comparison = () => {
    const [selectedIdx, setSelectedIdx]  = useState(0);
    return (
        <>
            <FrameBox
                frameSequence={frameSequence}
                selectedIdx={selectedIdx}
                setSelectedIdx={setSelectedIdx}
            />
            <div className="comparison-container">
                <ImageBlockConst 
                    url="/images/h264.jpg" 
                    type="H.264"
                />
                <ImageBlockSelect 
                    url="/images/mpeg1.jpg" 
                    types={["MPEG-1", "H.265", "VP9"]}
                />
            </div>

        </>
    );
};

export default Comparison;
