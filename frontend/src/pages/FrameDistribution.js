import React, {useEffect, useState} from 'react';
import {useSettings} from "../context/SettingsContext";
import './../styles/pages/FrameDistribution.css';
import apiUrl from '../utils/urls'

const FramesDistribution = () => {
    const { parameters } = useSettings();
    const [selectedIdx, setSelectedIdx] = useState(0);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [frames, setFrames] = useState([]);
    const filename = parameters.compressedFilename;

    useEffect(() => {
        const fetchFrames = async () => {
            const resp = await fetch(`${apiUrl}/video/frames/${filename}/`);
            const reader = resp.body.getReader();
            const decoder = new TextDecoder("UTF-8");
            const fetchedFrames = [];
            while (true) {
                const {value, done} = await reader.read();
                if (done) {
                    break;
                }
                const decodedData = decoder.decode(value);
                const framesLists = decodedData.split("\n");
                framesLists.pop();
                for (const newFrames of framesLists) {
                    const parsedFrames = JSON.parse(newFrames);
                    fetchedFrames.push(...parsedFrames);
                    setFrames(fetchedFrames);
                }
            }
        }

        fetchFrames()
            .then(() => {})
            .catch((error) => console.log(error));
    }, [filename]);

    const handleFrameClick = (index) => {
        setSelectedIdx(index);
    };

    const getFrameImageUrl = (index) => {
        if (frames.length > 0 && index < frames.length) {
            return `${apiUrl}/${frames[index].image_url}`;
        }
        return null;
    };

    return (
        <div className="distribution-container">
            <div className="timeline-container">
                <div className="time-labels">
                    {Array.from({length: 21}, (_, i) => (
                        <div key={i} className="time-label">{(i * 0.1).toFixed(1)}</div>
                    ))}
                </div>

                <div id="frameBox" className="frameBox">
                    {frames.map((frame, idx) => {
                        console.log(frames.length)
                        return (
                            <div
                                key={idx}
                                className={`frame ${frame.type} ${selectedIdx === idx ? 'selected' : ''}`}
                                onClick={() => handleFrameClick(idx)}
                                title={`Frame ${idx} (${frame.type}), Time: ${frame.pts_time}s`}
                            >
                                {frame.type}
                            </div>
                        )
                    })}
                </div>
            </div>

            <div className="main-frame-container">
                <div className="left-section">
                    {frames.length > 0 && selectedIdx < frames.length && (
                        <div className="frame-preview">
                            <img
                                src={getFrameImageUrl(selectedIdx)}
                                alt={`Frame ${selectedIdx} (${frames[selectedIdx].type})`}
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = 'https://via.placeholder.com/400x300?text=Frame+not+found';
                                }}
                            />
                            <div className="frame-info">
                                <p>Frame: {selectedIdx}</p>
                                <p>Type: {frames[selectedIdx].type}</p>
                                <p>Time: {frames[selectedIdx].pts_time}s</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="right-section">
                    <div className="frame-preview-right">
                        <button className="highlight-macroblock">Highlight macroblocks</button>
                    </div>

                    <div className="macroblock-box">
                        <h3>Macroblock Information</h3>
                        {frames.length > 0 && selectedIdx < frames.length && (
                            <>
                                <div className="macroblock-placeholder">
                                    <p>Macroblock visualization would appear here</p>
                                </div>
                                <div className="macroblock-info">
                                    <p>Type: {frames[selectedIdx].type}</p>
                                    <p>Time: {frames[selectedIdx].pts_time}s</p>
                                </div>
                            </>
                        )}
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
                        {frames.length > 0 && (
                            <div className="history-content">
                                <p>Frame {selectedIdx} ({frames[selectedIdx].type}) history:</p>
                                <ul>
                                    <li>First appearance: Frame 0</li>
                                    <li>Last modified: Frame {Math.max(0, selectedIdx - 1)}</li>
                                    <li>Reference count: {frames[selectedIdx].type === 'B' ? 2 : 1}</li>
                                </ul>
                            </div>
                        )}
                        <button onClick={() => setShowHistoryModal(false)}>Close</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FramesDistribution;