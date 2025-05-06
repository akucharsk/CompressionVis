import FrameBox from "../components/FrameBox";
import { useState } from "react";
import { frameSequence } from "./data/FrameSequences";

const Comparison = () => {
    const [selectedIdx, setSelectedIdx]  = useState(0);
    return (
        <FrameBox
            frameSequence={frameSequence}
            selectedIdx={selectedIdx}
            setSelectedIdx={setSelectedIdx}
        />
    );
};

export default Comparison;
