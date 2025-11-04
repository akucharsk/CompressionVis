import React, { useState } from 'react';
import { useFrames } from "../context/FramesContext";
import MacroblockHistory from "../components/frameDistribution/MacroblockHistory";
import MacroblockInfo from "../components/frameDistribution/MacroblockInfo";
import FrameBox from "../components/FrameBox";
import './../styles/pages/FrameDistribution.css';
import ImageVideoBlock from '../components/ImageVideoBlock';
import Spinner from '../components/Spinner';

const FramesDistribution = () => {
    const { frames, framesQuery, selectedIdx } = useFrames();
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    
    if (framesQuery.isPending) {
        return (
            <div className="loading-overlay">
                <Spinner />
            </div>
        );
    }

    return (
        <div className="distribution-container">
            <FrameBox />
            <div className="main-frame-container">

                <ImageVideoBlock />
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