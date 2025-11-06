import {forwardRef, useEffect, useState} from "react";
import "../../styles/components/distribution/Macroblock.css";

function cropSelectedBlock(frameImage, block, setThumbUrl) {
    const { x, y, width, height } = block;
    if (!width || !height) return;

    const cropCanvas = document.createElement("canvas");
    const ctx = cropCanvas.getContext("2d");

    cropCanvas.width = width;
    cropCanvas.height = height;

    ctx.drawImage(
        frameImage,
        x - width / 2,
        y - height / 2,
        width,
        height,
        0, 0, width, height
    );

    setThumbUrl(cropCanvas.toDataURL());
}

const MacroblockInfo = forwardRef((props, ref) => {
    const { selectedBlock, setSelectedBlock, frameImageUrl } = props;
    const [thumbUrl, setThumbUrl] = useState(null);
    const [displayBlock, setDisplayBlock] = useState(null);

    useEffect(() => {
        if (selectedBlock) {
            setDisplayBlock(selectedBlock);
        }
    }, [selectedBlock]);

    useEffect(() => {
        if (!frameImageUrl || !displayBlock) {
            return;
        }

        const img = new Image();
        img.src = frameImageUrl;

        img.onload = () => {
            cropSelectedBlock(img, displayBlock, setThumbUrl);
        };

        return () => {
            img.onload = null;
        };
    }, [frameImageUrl, displayBlock]);

    return (
        <div ref={ref} className={`macroblock-info-box ${selectedBlock ? "visible" : ""}`}>
            <h4>Macroblock details</h4>

            {thumbUrl && (
                <img
                    src={thumbUrl}
                    alt="Macroblock preview"
                    style={{
                        width: "120px",
                        height: "120px",
                        imageRendering: "pixelated",
                        border: "1px solid #555",
                        marginBottom: "10px"
                    }}
                />
            )}

            <p><strong>Type:</strong> {displayBlock?.type}</p>
            <p><strong>Position:</strong> ({displayBlock?.x}, {displayBlock?.y})</p>
            <p><strong>Size:</strong> {displayBlock?.width}x{displayBlock?.height}</p>
            <p><strong>Ffmpeg type:</strong> {displayBlock?.ftype}</p>
            <p><strong>Reference frame:</strong> {displayBlock?.source}</p>

            {displayBlock?.src_x != null && (
                <p><strong>Source:</strong> ({displayBlock.src_x}, {displayBlock.src_y})</p>
            )}

            <button
                className="macroblock-close-btn"
                onClick={() => setSelectedBlock(null)}
            >
                Close
            </button>
        </div>
    );
});

export default MacroblockInfo;
