import {forwardRef, useEffect, useState} from "react";
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

const MacroblockHistory = forwardRef((props, ref) => {
    const {
        selectedBlock,
        setSelectedBlock,
        frameImageUrl,
        prevFrameImageUrl,
        nextFrameImageUrl
    } = props;

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

    return (
        <div ref={ref} className={`macroblock-info-box ${selectedBlock ? "visible" : ""}`}>
            <h4>Macroblock history</h4>

            <div className="macroblock-history">
                <div className="mb-slot">
                    {(displayBlock?.source < 0 || displayBlock?.source2 < 0) ? (
                        <Macroblock name="Previous reference" url={thumbs.previous} />
                    ) : (
                        <div className="mb-placeholder" />
                    )}
                </div>

                <div className="mb-slot">
                    {(displayBlock?.source < 0 || displayBlock?.source2 < 0) ? (
                        <Macroblock name="Moved macroblock" url={thumbs.moved} />
                    ) : (
                        <div className="mb-placeholder" />
                    )}
                </div>

                <div className="mb-slot">
                    <Macroblock name="Result" url={thumbs.result} />
                </div>

                <div className="mb-slot">
                    {(displayBlock?.source > 0 || displayBlock?.source2 > 0) ? (
                        <Macroblock name="Moved macroblock" url={thumbs.moved2} />
                    ) : (
                        <div className="mb-placeholder" />
                    )}
                </div>

                <div className="mb-slot">
                    {(displayBlock?.source > 0 || displayBlock?.source2 > 0) ? (
                        <Macroblock name="Next reference" url={thumbs.next} />
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
});

export default MacroblockHistory;
