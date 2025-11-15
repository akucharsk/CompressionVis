import {useEffect, useState} from "react";
import "../../styles/components/distribution/Macroblock.css";
import Macroblock from "./Macroblock";

function cropBlock(frameImage, block, offsetX, offsetY) {
    const { width, height } = block;
    if (!frameImage || !width || !height) return null;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = width;
    canvas.height = height;

    ctx.drawImage(
        frameImage,
        offsetX - width / 2,
        offsetY - height / 2,
        width,
        height,
        0,
        0,
        width,
        height
    );

    return canvas.toDataURL();
}

const MacroblockHistory = ({selectedBlock, setSelectedBlock, frameImageUrl, prevFrameImageUrl, nextFrameImageUrl}) => {

    const [thumbs, setThumbs] = useState({});
    const [displayBlock, setDisplayBlock] = useState(null);

    useEffect(() => {
        if (selectedBlock) {
            setDisplayBlock(selectedBlock);
        }
    }, [selectedBlock]);

    useEffect(() => {
        if (!displayBlock || !frameImageUrl) return;

        const { x, y, src_x, src_y, src_x2, src_y2, source, source2 } = displayBlock;

        const frameImages = {
            current: frameImageUrl,
            prev: prevFrameImageUrl,
            next: nextFrameImageUrl
        };

        const loadImage = (url) => {
            return new Promise((resolve) => {
                if (!url) return resolve(null);
                const img = new Image();
                img.src = url;
                img.onload = () => resolve(img);
                img.onerror = () => resolve(null);
            });
        };

        Promise.all([
            loadImage(frameImages.current),
            loadImage(frameImages.prev),
            loadImage(frameImages.next)
        ]).then(([currentImg, prevImg, nextImg]) => {
            const newThumbs = {};

            newThumbs.result = cropBlock(currentImg, displayBlock, x, y);

            if (source < 0 || source2 < 0) {
                const img = prevImg;
                newThumbs.moved =
                    (source < 0 && cropBlock(img, displayBlock, src_x, src_y)) ||
                    (source2 < 0 && cropBlock(img, displayBlock, src_x2, src_y2));
                newThumbs.previous = cropBlock(img, displayBlock, x, y);
            }

            if (source > 0 || source2 > 0) {
                const img = nextImg;
                newThumbs.moved2 =
                    (source > 0 && cropBlock(img, displayBlock, src_x, src_y)) ||
                    (source2 > 0 && cropBlock(img, displayBlock, src_x2, src_y2));
                newThumbs.next = cropBlock(img, displayBlock, x, y);
            }

            setThumbs(newThumbs);
        });
    }, [displayBlock, frameImageUrl, prevFrameImageUrl, nextFrameImageUrl]);

    const blockWidth = displayBlock?.width || 16;
    const blockHeight = displayBlock?.height || 16;

    return (
        <div className={`macroblock-info-box ${selectedBlock ? "visible" : ""}`}>
            <h4>Macroblock history</h4>

            <div className="macroblock-history">
                <div className="mb-slot">
                    {(displayBlock?.source < 0 || displayBlock?.source2 < 0) ? (
                        <Macroblock
                            name="Previous reference"
                            url={thumbs.previous}
                            width={blockWidth}
                            height={blockHeight}
                        />
                    ) : (
                        <div className="mb-placeholder" />
                    )}
                </div>

                <div className="arrow-slot">
                    {(displayBlock?.source < 0 || displayBlock?.source2 < 0) ? (
                        <div className="arrow">→</div>
                    ) : (
                        <div className="mb-placeholder" />
                    )}
                </div>

                <div className="mb-slot">
                    {(displayBlock?.source < 0 || displayBlock?.source2 < 0) ? (
                        <Macroblock
                            name="Moved macroblock"
                            url={thumbs.moved}
                            width={blockWidth}
                            height={blockHeight}
                        />
                    ) : (
                        <div className="mb-placeholder" />
                    )}
                </div>

                <div className="arrow-slot">
                    {(displayBlock?.source < 0 || displayBlock?.source2 < 0) ? (
                        <div className="arrow">→</div>
                    ) : (
                        <div className="mb-placeholder" />
                    )}
                </div>

                <div className="mb-slot">
                    <Macroblock
                        name="Result"
                        url={thumbs.result}
                        width={blockWidth}
                        height={blockHeight}
                    />
                </div>

                <div className="arrow-slot">
                    {(displayBlock?.source > 0 || displayBlock?.source2 > 0) ? (
                        <div className="arrow">←</div>
                    ) : (
                        <div className="mb-placeholder" />
                    )}
                </div>

                <div className="mb-slot">
                    {(displayBlock?.source > 0 || displayBlock?.source2 > 0) ? (
                        <Macroblock
                            name="Moved macroblock"
                            url={thumbs.moved2}
                            width={blockWidth}
                            height={blockHeight}
                        />
                    ) : (
                        <div className="mb-placeholder" />
                    )}
                </div>

                <div className="arrow-slot">
                    {(displayBlock?.source > 0 || displayBlock?.source2 > 0) ? (
                        <div className="arrow">←</div>
                    ) : (
                        <div className="mb-placeholder" />
                    )}
                </div>

                <div className="mb-slot">
                    {(displayBlock?.source > 0 || displayBlock?.source2 > 0) ? (
                        <Macroblock
                            name="Next reference"
                            url={thumbs.next}
                            width={blockWidth}
                            height={blockHeight}
                        />
                    ) : (
                        <div className="mb-placeholder" />
                    )}
                </div>
            </div>

            <button className="macroblock-close-btn" onClick={() => setSelectedBlock(null)}>
                Close
            </button>
        </div>
    );
};

export default MacroblockHistory;