import React, { useEffect, useState } from "react";
import { useFrames } from "../context/FramesContext";
import apiUrl from "../utils/urls";

const FramesBox = ({filename}) => {
    const { frames, setFrames, selectedIdx, setSelectedIdx } = useFrames();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const cachedFrames = sessionStorage.getItem('frames');
        if (cachedFrames) {
            setFrames(JSON.parse(cachedFrames));
            setIsLoading(false);
        } else if (filename) {
            fetch(`${apiUrl}/video/frames/${filename}`)
                .then((res) => {
                    const reader = res.body.getReader();
                    const decoder = new TextDecoder("UTF-8");

                    const newFrames = [];
                    const readStream = ({value, done}) => {
                        if (done) return;
                        const decodedValue = decoder.decode(value);
                        const frameLists = decodedValue.split("\n");
                        frameLists.pop();
                        for (const strFrames of frameLists) {
                            const parsedFrames = JSON.parse(strFrames);
                            newFrames.push(...parsedFrames);
                            setFrames(newFrames);
                        }
                        reader.read()
                            .then(({value, done}) => readStream({value, done}))
                    }

                    reader.read()
                        .then(({value, done}) => readStream({value, done}))
                        .then(() => sessionStorage.setItem('frames', JSON.stringify(newFrames)))
                })
                .catch((error) => console.error("Failed to fetch frames:", error))
                .finally(() => setIsLoading(false));
        }
    }, [filename, setFrames]);

    if (isLoading) {
        return (
            <div className="loading-overlay">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="timeline-container">
            <div className="time-labels">
                {Array.from({length: 42}, (_, i) => (
                    <div key={i} className="time-label">{(i * 0.04).toFixed(2)}</div>
                ))}
            </div>
            <div className="frameBox">
                {frames.map((frame, idx) => (
                    <div
                        key={idx}
                        className={`frame ${frame.type} ${selectedIdx === idx ? 'selected' : ''}`}
                        onClick={() => setSelectedIdx(idx)}
                        title={`Frame ${idx} (${frame.type}), Time: ${frame.pts_time}s`}
                    >
                        {frame.type}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FramesBox;