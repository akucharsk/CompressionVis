import {useEffect, useRef, useState} from "react";
import '../../styles/components/distribution/Macroblock.css';

const MacroblockInfo = ({ selectedBlock, frames, currentFrameIdx }) => {
    const [displayBlock, setDisplayBlock] = useState(null);
    const [moreBlock, setMoreBlock] = useState(null);
    const ref = useRef(null);

    useEffect(() => {
        if (selectedBlock) {
            setDisplayBlock(selectedBlock);
            if (selectedBlock?.more === true) {
                setMoreBlock(selectedBlock);
            }
        }
    }, [selectedBlock]);

    useEffect(() => {
        if (ref.current) {
            if (selectedBlock && displayBlock) {
                setTimeout(() => {
                    if (ref.current) {
                        ref.current.style.maxHeight = ref.current.scrollHeight + 10 + 'px';
                    }
                }, 250);
            } else {
                ref.current.style.maxHeight = '0';
            }
        }
    }, [selectedBlock, displayBlock, moreBlock]);

    const getRefFrameNumber = (offset) => {
        if (!frames || typeof currentFrameIdx !== 'number' || !offset) return "-";

        const direction = offset < 0 ? -1 : 1;
        const targetCount = Math.abs(offset);
        let foundCount = 0;
        let i = currentFrameIdx + direction;

        while (i >= 0 && i < frames.length) {
            const frame = frames[i];
            if (frame.type === 'I' || frame.type === 'P') {
                foundCount++;
                if (foundCount === targetCount) {
                    return frame.frame_number + 1;
                }
            }
            i += direction;
        }
        return "Unknown";
    };

    return (
        <div ref={ref} className={`content-box info macroblock-data ${selectedBlock ? "visible" : ""}`}>
            <h3>Macroblock information</h3>
            <p><strong>Type:</strong> {displayBlock?.type}</p>
            <p><strong>Position:</strong> ({displayBlock?.x}, {displayBlock?.y})</p>
            <p><strong>Size:</strong> {displayBlock?.width}x{displayBlock?.height}</p>
            <p><strong>Ffmpeg debug type:</strong> {displayBlock?.ftype}</p>

            <p><strong>Reference frame:</strong> #{getRefFrameNumber(displayBlock?.source)}</p>
            <p><strong>Vector:</strong> ({displayBlock?.x - displayBlock?.src_x}, {displayBlock?.y - displayBlock?.src_y})</p>

            <div className={`more-info ${displayBlock?.more === true ? "visible" : ""}`}>
                <p><strong>Reference frame 2:</strong> #{getRefFrameNumber(moreBlock?.source2)}</p>
                <p><strong>Vector 2:</strong> ({displayBlock?.x - moreBlock?.src_x2}, {displayBlock?.y - moreBlock?.src_y2})</p>
            </div>
        </div>
    );
};

export default MacroblockInfo;