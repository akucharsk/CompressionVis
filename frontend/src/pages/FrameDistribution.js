import React, { useState } from 'react';
import { useFrames } from "../context/FramesContext";
import MacroblockHistory from "../components/frameDistribution/MacroblockHistory";
import Frame from "../components/frameDistribution/Frame";
import MacroblockInfo from "../components/frameDistribution/MacroblockInfo";
import FrameBox from "../components/FrameBox";
import './../styles/pages/FrameDistribution.css';
import {useNavigate, useSearchParams} from "react-router-dom";
import VideoPlayerForAnalysis from '../components/frameDistribution/VideoPlayerForAnalysis';
import { useDisplayMode } from '../context/DisplayModeContext';

const FramesDistribution = () => {
    const { frames,  selectedIdx, setSelectedIdx } = useFrames();
    const { displayMode, setDisplayMode } = useDisplayMode();

    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const videoId = searchParams.get("videoId");

    return (
        <div className="distribution-container">
            <FrameBox />
            <div className="main-frame-container">
                {displayMode === "frames" ? (
                    <Frame
                        selectedIdx={selectedIdx}
                        frames={frames}
                    />
                ) : (
                    <VideoPlayerForAnalysis
                        videoId={videoId}
                    />
                )}
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