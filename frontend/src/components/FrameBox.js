import React, { useEffect, useState } from "react";
import { useFrames } from "../context/FramesContext";
import apiUrl from "../utils/urls";
import '../styles/components/FrameBox.css';

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

    useEffect(() => {
        const container = document.querySelector('.scrollable-frameBox');
        const selectedFrame = container?.children[selectedIdx];

        if (!container || !selectedFrame) return;

        const containerRect = container.getBoundingClientRect();
        const frameRect = selectedFrame.getBoundingClientRect();

        const isFullyVisible =
            frameRect.left >= containerRect.left &&
            frameRect.right <= containerRect.right;

        if (!isFullyVisible) {
            const timeout = setTimeout(() => {
                selectedFrame.scrollIntoView({
                    behavior: 'smooth',
                    inline: 'center',
                    block: 'nearest',
                });
            }, 80);

            return () => clearTimeout(timeout);
        }
    }, [selectedIdx]);


    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowLeft') {
                setSelectedIdx(prev => {
                    const newIdx = Math.max(0, prev - 1);
                    document.querySelector('.scrollable-frameBox')?.children[newIdx]?.scrollIntoView({ behavior: 'smooth', inline: 'center' });
                    return newIdx;
                });
            } else if (e.key === 'ArrowRight') {
                setSelectedIdx(prev => {
                    const newIdx = Math.min(frames.length - 1, prev + 1);
                    document.querySelector('.scrollable-frameBox')?.children[newIdx]?.scrollIntoView({ behavior: 'smooth', inline: 'center' });
                    return newIdx;
                });
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [frames.length]);

    if (isLoading) {
        return (
            <div className="loading-overlay">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="timeline-container">
            <button className="scroll-button left" onClick={() => {
                document.querySelector('.scrollable-frameBox').scrollBy({left: -300, behavior: 'smooth'});
            }}>&lt;</button>
            <div className="scrollable-frameBox">
                {frames.map((frame, idx) => (
                    <div key={idx} className="frameWithTime">
                        <div className="time-label">{parseFloat(frame.pts_time).toFixed(2)}s</div>
                        <div
                            className={`frame ${frame.type} ${selectedIdx === idx ? 'selected' : ''}`}
                            onClick={() => setSelectedIdx(idx)}
                            title={`Frame ${idx} (${frame.type}), Time: ${frame.pts_time}s`}
                        >
                            {frame.type}
                        </div>
                    </div>
                ))}
            </div>
            <button className="scroll-button right" onClick={() => {
                document.querySelector('.scrollable-frameBox').scrollBy({left: 300, behavior: 'smooth'});
            }}>&gt;</button>
        </div>
    );
};

export default FramesBox;