import React, { useRef, useState } from 'react';
import { useFrames } from "../context/FramesContext";
import MacroblockHistory from "../components/frameDistribution/MacroblockHistory";
import MacroblockInfo from "../components/frameDistribution/MacroblockInfo";
import FrameBox from "../components/FrameBox";
import './../styles/pages/FrameDistribution.css';
import ImageVideoBlock from '../components/ImageVideoBlock';
import Spinner from '../components/Spinner';
import { useSearchParams } from 'react-router-dom';

const FramesDistribution = () => {
    const { frames, framesQuery, selectedIdx } = useFrames();
    const [ params ] = useSearchParams();

    const [showHistoryModal, setShowHistoryModal] = useState(false);
    
    const videoRef = useRef(null);

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

                <ImageVideoBlock 
                    isConst={false}
                    videoId={videoId}
                    videoRef={videoRef}
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