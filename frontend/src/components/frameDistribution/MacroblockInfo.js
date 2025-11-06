import { useEffect, useState } from "react";
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

const MacroblockInfo = ({ selectedBlock, setSelectedBlock, frameImageUrl }) => {
    const [thumbUrl, setThumbUrl] = useState(null);

    useEffect(() => {
        if (!frameImageUrl || !selectedBlock) {
            setThumbUrl(null);
            return;
        }

        const img = new Image();
        img.src = frameImageUrl;

        img.onload = () => {
            cropSelectedBlock(img, selectedBlock, setThumbUrl);
        };

        return () => {
            img.onload = null;
        };
    }, [frameImageUrl, selectedBlock]);

    if (!selectedBlock) return null;

    return (
        <div className="macroblock-info-box">
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

            <p><strong>Type:</strong> {selectedBlock.type || "N/A"}</p>
            <p><strong>Position:</strong> ({selectedBlock.x}, {selectedBlock.y})</p>
            <p><strong>Size:</strong> {selectedBlock.width}x{selectedBlock.height}</p>
            <p><strong>Ffmpeg type:</strong> {selectedBlock.ftype ?? "N/A"}</p>
            <p><strong>Reference frame:</strong> {selectedBlock.source ?? "N/A"}</p>

            {selectedBlock.src_x != null && (
                <p><strong>Source:</strong> ({selectedBlock.src_x}, {selectedBlock.src_y})</p>
            )}

            <button
                className="macroblock-close-btn"
                onClick={() => setSelectedBlock(null)}
            >
                Close
            </button>
        </div>
    );
};

export default MacroblockInfo;
