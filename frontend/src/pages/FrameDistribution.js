import React, { useState } from 'react';
import { useFrames } from "../context/FramesContext";
import MacroblockHistory from "../components/frameDistribution/MacroblockHistory";
import Frame from "../components/frameDistribution/Frame";
import MacroblockInfo from "../components/frameDistribution/MacroblockInfo";
import FramesBox from "../components/FrameBox";
import './../styles/pages/FrameDistribution.css';
import {useNavigate, useSearchParams} from "react-router-dom";

const FramesDistribution = () => {
    const { frames, setFrames, selectedIdx, setSelectedIdx  } = useFrames();
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();

    const compressedFilename = searchParams.get("filename");

    // if (!compressedUrl) {
    //     navigate("/404");
    // }

    return (
        <div className="distribution-container">
            <FramesBox
                filename={compressedFilename}
            />
            <div className="main-frame-container">
                <Frame
                    selectedIdx={selectedIdx}
                    frames={frames}
                />
                <MacroblockInfo
                    selectedIdx={selectedIdx}
                    frames={frames}
                    handleOnClick={setShowHistoryModal}
                />
            </div>
            {showHistoryModal && (
                <MacroblockHistory
                    selectedIdx={selectedIdx}
                    frames={frames}
                    handleOffClick={setShowHistoryModal}
                />
            )}
        </div>
    );
};

export default FramesDistribution;