import React, {useRef, useState} from 'react';
import { useFrames } from "../context/FramesContext";
import Frame from "../components/frameDistribution/Frame";
import SidePanel from "../components/frameDistribution/SidePanel";
import FramesBox from "../components/FrameBox";
import './../styles/pages/FrameDistribution.css';
import MacroblockHistory from "../components/frameDistribution/MacroblockHistory";

const FramesDistribution = () => {
    const { frames, selectedIdx } = useFrames();
    const [showGrid, setShowGrid] = useState(false);
    const [showVectors, setShowVectors] = useState(false);
    const [imageUrl, setImageUrl] = useState(null);
    const [prevImageUrl, setPrevImageUrl] = useState(null);
    const [nextImageUrl, setNextImageUrl] = useState(null);
    const infoRef = useRef(null);
    const [currentFrameIdx, setCurrentFrameIdx] = useState(null);
    const [selectedBlock, setSelectedBlock] = useState(null);
    const [mode, setMode] = useState("grid");
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
                <div className="left-section">
                    <Frame
                        selectedIdx={selectedIdx}
                        frames={frames}
                        showGrid={showGrid}
                        showVectors={showVectors}
                        visibleCategories={visibleCategories}
                        setImageUrl={setImageUrl}
                        imageUrl={imageUrl}
                        infoRef={infoRef}
                        setCurrentFrameIdx={setCurrentFrameIdx}
                        currentFrameIdx={currentFrameIdx}
                        selectedBlock={selectedBlock}
                        setSelectedBlock={setSelectedBlock}
                        setPrevImageUrl={setPrevImageUrl}
                        setNextImageUrl={setNextImageUrl}
                        mode={mode}
                        setMode={setMode}
                    />
                    <MacroblockHistory
                        ref={infoRef}
                        selectedBlock={selectedBlock}
                        setSelectedBlock={setSelectedBlock}
                        frameImageUrl={imageUrl}
                        frameNumber={currentFrameIdx}
                        prevFrameImageUrl={prevImageUrl}
                        nextFrameImageUrl={nextImageUrl}
                    />
                </div>
                <SidePanel
                    selectedIdx={selectedIdx}
                    frames={frames}
                    setShowVectors={setShowVectors}
                    setShowGrid={setShowGrid}
                    showVectors={showVectors}
                    showGrid={showGrid}
                    visibleCategories={visibleCategories}
                    toggleCategory={toggleCategory}
                    selectedBlock={selectedBlock}
                    mode={mode}
                    setMode={setMode}
                />
            </div>

        </div>
    );
};

export default FramesDistribution;