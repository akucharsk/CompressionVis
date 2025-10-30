import React, { useState } from 'react';
import { useFrames } from "../context/FramesContext";
import MacroblockHistory from "../components/frameDistribution/MacroblockHistory";
import Frame from "../components/frameDistribution/Frame";
import SidePanel from "../components/frameDistribution/SidePanel";
import FramesBox from "../components/FrameBox";
import './../styles/pages/FrameDistribution.css';

const FramesDistribution = () => {
    const { frames, selectedIdx } = useFrames();
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [showGrid, setShowGrid] = useState(false);
    const [showVectors, setShowVectors] = useState(false);
    const [visibleCategories, setVisibleCategories] = useState({
        intra: true,
        inter: true,
        skip: true,
        direct: true
    });

    const toggleCategory = (category) => {
        setVisibleCategories(prev => ({
            ...prev,
            [category]: !prev[category]
        }));
    };


    return (
        <div className="distribution-container">
            <FramesBox />
            <div className="main-frame-container">
                <Frame
                    selectedIdx={selectedIdx}
                    frames={frames}
                    showGrid={showGrid}
                    showVectors={showVectors}
                    visibleCategories={visibleCategories}
                />
                <SidePanel
                    selectedIdx={selectedIdx}
                    frames={frames}
                    setShowVectors={setShowVectors}
                    setShowGrid={setShowGrid}
                    showVectors={showVectors}
                    showGrid={showGrid}
                    visibleCategories={visibleCategories}
                    toggleCategory={toggleCategory}
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