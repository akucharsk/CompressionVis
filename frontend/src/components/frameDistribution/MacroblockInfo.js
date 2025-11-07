import {useEffect, useRef, useState} from "react";
import '../../styles/components/distribution/Macroblock.css';

const MacroblockInfo = ({ selectedBlock }) => {
    const [displayBlock, setDisplayBlock] = useState(null);
    const ref = useRef(null);

    useEffect(() => {
        if (selectedBlock) {
            setDisplayBlock(selectedBlock);
        }
    }, [selectedBlock]);

    useEffect(() => {
        if (ref.current) {
            if (selectedBlock) {
                ref.current.style.maxHeight = ref.current.scrollHeight + 'px';
            } else {
                ref.current.style.maxHeight = '0';
            }
        }
    }, [selectedBlock]);

    console.log(displayBlock?.more);
    return (
        <div ref={ref} className={`content-box info macroblock-data ${selectedBlock ? "visible" : ""}`}>
            <h3>Macroblock information</h3>
            <p><strong>Type:</strong> {displayBlock?.type}</p>
            <p><strong>Position:</strong> ({displayBlock?.x}, {displayBlock?.y})</p>
            <p><strong>Size:</strong> {displayBlock?.width}x{displayBlock?.height}</p>
            <p><strong>Ffmpeg debug type:</strong> {displayBlock?.ftype}</p>
            <p><strong>Reference frame:</strong> {displayBlock?.source}</p>
            <p><strong>Source:</strong> ({displayBlock?.src_x}, {displayBlock?.src_y})</p>
            {displayBlock?.more === true && (
                <>
                    <p><strong>Reference frame 2:</strong> {displayBlock?.source2}</p>
                    <p><strong>Source 2:</strong> ({displayBlock?.src_x2}, {displayBlock?.src_y2})</p>
                </>
            )}
        </div>
    );
};

export default MacroblockInfo;
