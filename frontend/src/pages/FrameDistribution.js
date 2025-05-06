import React, {useEffect, useState} from 'react';
import {useSettings} from "../context/SettingsContext";
import './../styles/pages/FrameDistribution.css';
import FrameBox from '../components/FrameBox';
import { frameSequence } from './data/FrameSequences';

const FramesDistribution = () => {
    const { videoFile, bandwidth, resolution, pattern } = useSettings() || {};
    const [selectedIdx, setSelectedIdx] = useState(0);
    const [imageUrl, setImageUrl] = useState(null);
    const [macroBlock, setMacroBlock] = useState(null);
    const [showHistoryModal, setShowHistoryModal] = useState(false);

    useEffect(() => {
        if (selectedIdx !== null) {
            if (selectedIdx === 0) {
                setImageUrl('https://www.w3schools.com/w3css/img_lights.jpg');
                return;
            }

            const selectedFrame = frameSequence[selectedIdx];
            fetch(``)
                .then(res => res.blob())
                .then(blob => setImageUrl(URL.createObjectURL(blob)))
                .catch(err => console.error("Error fetching image:", err));
        }
    }, [selectedIdx]);


    return (
        <div className="distribution-container">
            <div className="timeline-container">
                <FrameBox 
                    // Right now temporary frameSequence
                    frameSequence={frameSequence}
                    selectedIdx={selectedIdx}
                    setSelectedIdx={setSelectedIdx}
                />
            </div>

            <div className="main-frame-container">
                <div className="left-section">
                    {imageUrl && (
                        <div className="frame-preview">
                            <img src={imageUrl} alt={`Frame ${selectedIdx}`}/>
                        </div>
                    )}
                </div>

                <div className="right-section">
                    <div className="frame-preview-right">
                        <button className="highlight-macroblock">Highlight macroblocks</button>
                    </div>

                    <div className="macroblock-box">
                        <h3>Example Macroblock</h3>
                        <img src={macroBlock} alt="Macroblock" className="macroblock-img"/>
                        <div className="macroblock-info">
                            <p>type: xyz</p>
                            <p>size: xyz</p>
                        </div>
                        <button
                            className="history-button"
                            onClick={() => setShowHistoryModal(true)}
                        >
                            Show macroblock history
                        </button>

                    </div>
                </div>
            </div>

            {showHistoryModal && (
                <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2>Macroblock History</h2>
                        <p>This is a sample history content...</p>
                        <button onClick={() => setShowHistoryModal(false)}>Close</button>
                    </div>
                </div>
            )}

        </div>

    );
};

export default FramesDistribution;
