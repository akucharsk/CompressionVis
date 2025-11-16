import React, { useRef, useState } from 'react';
import { useFrames } from "../context/FramesContext";
import SidePanel from "../components/frameDistribution/SidePanel";
import MacroblockHistory from "../components/frameDistribution/MacroblockHistory";
import FrameBox from "../components/FrameBox";
import './../styles/pages/FrameDistribution.css';
import ImageVideoBlock from '../components/ImageVideoBlock';
import Spinner from '../components/Spinner';
import { useSearchParams } from 'react-router-dom';
import { useMacroblockHistoryQuery } from '../hooks/macroblock-history-query';
import { useEffect } from 'react';

const FramesDistribution = () => {
    const [showGrid, setShowGrid] = useState(false);
    const [showVectors, setShowVectors] = useState(false);
    const [selectedBlock, setSelectedBlock] = useState(null);
    const [mode, setMode] = useState("grid");
    const [visibleCategories, setVisibleCategories] = useState({
        intra: true,
        inter: true,
        skip: true,
        direct: true
    });
    const [history, setHistory] = useState(null);
    const { frames, framesQuery, selectedIdx } = useFrames();
    const macroblockHistoryQuery = useMacroblockHistoryQuery(selectedBlock);
    const [ params ] = useSearchParams();

    const videoRef = useRef(null);

    const toggleCategory = (category) => {
        setVisibleCategories(prev => ({
            ...prev,
            [category]: !prev[category]
        }));
    };

    useEffect(() => {
        if (macroblockHistoryQuery.data) {
            setHistory(macroblockHistoryQuery.data);
        }
    }, [macroblockHistoryQuery.data]);

    const videoId = parseInt(params.get("videoId"));

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
                <div className="left-section">
                    <ImageVideoBlock
                        isConst={false}
                        videoId={videoId}
                        videoRef={videoRef}
                        showGrid={showGrid}
                        showVectors={showVectors}
                        visibleCategories={visibleCategories}
                        selectedBlock={selectedBlock}
                        setSelectedBlock={setSelectedBlock}
                        mode={mode}
                        macroblocks={true}
                    />
                    <MacroblockHistory
                        selectedBlock={selectedBlock}
                        setSelectedBlock={setSelectedBlock}
                        history={history}
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