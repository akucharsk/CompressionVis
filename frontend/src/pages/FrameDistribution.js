import React, { useState } from 'react';
import { useFrames } from "../context/FramesContext";
import MacroblockHistory from "../components/frameDistribution/MacroblockHistory";
import Frame from "../components/frameDistribution/Frame";
import MacroblockInfo from "../components/frameDistribution/MacroblockInfo";
import FrameBox from "../components/FrameBox";
import './../styles/pages/FrameDistribution.css';
import {useNavigate, useSearchParams} from "react-router-dom";
import Video from '../components/frameDistribution/Video';

const FramesDistribution = () => {
    const { frames,  selectedIdx, setSelectedIdx } = useFrames();
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    // const [presentationMode, setPresentationMode] = useState("frames");
    // const [isPlaying, setIsPlaying] = useState(false);
    const [videoUrl, setVideoUrl] = useState(null);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const videoId = searchParams.get("videoId");

    // if (!compressedUrl) {
    //     navigate("/404");
    // }

    return (
        <div className="distribution-container">
            <FrameBox 
                // presentationMode={presentationMode}
                // setPresentationMode={setPresentationMode}
                // isPlaying={isPlaying}
                // setIsPlaying={setIsPlaying}
            />
            <div className="main-frame-container">
                {presentationMode === "frames" ? (
                    <Frame
                        selectedIdx={selectedIdx}
                        frames={frames}
                    />
                ) : (
                    <Video
                        videoId={videoId}
                        // isPlaying={isPlaying}
                        // setIsPlaying={setIsPlaying}
                        videoUrl={videoUrl}
                        setVideoUrl={setVideoUrl}
                        setSelectedIdx={setSelectedIdx}
                        frames={frames}
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