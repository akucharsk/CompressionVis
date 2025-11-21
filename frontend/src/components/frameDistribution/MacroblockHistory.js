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
    ctx.drawImage(frameImage, offsetX - width / 2, offsetY - height / 2, width, height, 0, 0, width, height);
    return { url: canvas.toDataURL(), ctx: ctx };
}

function blendBlocks(ctx1, ctx2, width, height) {
    if (!ctx1 || !ctx2) return null;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(ctx1.canvas, 0, 0);
    const imgData1 = ctx1.getImageData(0, 0, width, height);
    const imgData2 = ctx2.getImageData(0, 0, width, height);
    const resultData = ctx.createImageData(width, height);
    for (let i = 0; i < resultData.data.length; i += 4) {
        resultData.data[i] = (imgData1.data[i] + imgData2.data[i]) / 2;
        resultData.data[i+1] = (imgData1.data[i+1] + imgData2.data[i+1]) / 2;
        resultData.data[i+2] = (imgData1.data[i+2] + imgData2.data[i+2]) / 2;
        resultData.data[i+3] = 255;
    }
    ctx.putImageData(resultData, 0, 0);
    return { url: canvas.toDataURL(), ctx: ctx };
}

function calculateDifference(ctxSource, ctxTarget, width, height) {
    if (!ctxSource || !ctxTarget) return null;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = width;
    canvas.height = height;
    const srcData = ctxSource.getImageData(0, 0, width, height).data;
    const targetData = ctxTarget.getImageData(0, 0, width, height).data;
    const diffData = ctx.createImageData(width, height);
    for (let i = 0; i < srcData.length; i += 4) {
        diffData.data[i] = Math.abs(srcData[i] - targetData[i]);
        diffData.data[i+1] = Math.abs(srcData[i+1] - targetData[i+1]);
        diffData.data[i+2] = Math.abs(srcData[i+2] - targetData[i+2]);
        diffData.data[i+3] = 255;
    }
    ctx.putImageData(diffData, 0, 0);
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
        const width = displayBlock.width;
        const height = displayBlock.height;

        const loadImage = (url) => {
            return new Promise((resolve) => {
                if (!url) return resolve(null);
                const img = new Image();
                img.crossOrigin = "Anonymous";
                img.src = url;
                img.onload = () => resolve(img);
                img.onerror = () => resolve(null);
            });
        };

        Promise.all([
            loadImage(frameImageUrl),
            loadImage(prevFrameImageUrl),
            loadImage(nextFrameImageUrl)
        ]).then(([currentImg, prevImg, nextImg]) => {
            const newThumbs = {};
            const resObj = cropBlock(currentImg, displayBlock, x, y);
            newThumbs.result = resObj?.url;

            const hasPrev = source < 0 || source2 < 0;
            const hasNext = source > 0 || source2 > 0;
            let movedPrevObj = null;
            let movedNextObj = null;
            let interpolationObj = null;

            if (hasPrev) {
                const img = prevImg;
                movedPrevObj = (source < 0) ? cropBlock(img, displayBlock, src_x, src_y)
                    : cropBlock(img, displayBlock, src_x2, src_y2);
                newThumbs.movedPrev = movedPrevObj?.url;
            }

            if (hasNext) {
                const img = nextImg;
                movedNextObj = (source > 0) ? cropBlock(img, displayBlock, src_x, src_y)
                    : cropBlock(img, displayBlock, src_x2, src_y2);
                newThumbs.movedNext = movedNextObj?.url;
            }

            if (hasPrev && hasNext) {
                interpolationObj = blendBlocks(movedPrevObj?.ctx, movedNextObj?.ctx, width, height);
                newThumbs.interpolation = interpolationObj?.url;
                newThumbs.diffPrev = calculateDifference(movedPrevObj?.ctx, interpolationObj?.ctx, width, height);
                newThumbs.diffNext = calculateDifference(movedNextObj?.ctx, interpolationObj?.ctx, width, height);
            } else {
                const activeMoved = movedPrevObj || movedNextObj;
                if (activeMoved && resObj) {
                    newThumbs.diffUni = calculateDifference(activeMoved.ctx, resObj.ctx, width, height);
                }
            }
            setThumbs(newThumbs);
        });
    }, [displayBlock, frameImageUrl, prevFrameImageUrl, nextFrameImageUrl]);

    const blockWidth = displayBlock?.width || 16;
    const blockHeight = displayBlock?.height || 16;

    const hasPrev = displayBlock?.source < 0 || displayBlock?.source2 < 0;
    const hasNext = displayBlock?.source > 0 || displayBlock?.source2 > 0;
    const isBiDir = hasPrev && hasNext;

    const getVectorText = (isPrevRef) => {
        let dx, dy;
        const s1 = displayBlock.source;

        if (isPrevRef) {
            if (s1 < 0) { dx = displayBlock.x - displayBlock.src_x; dy = displayBlock.y - displayBlock.src_y; }
            else { dx = displayBlock.x - displayBlock.src_x2; dy = displayBlock.y - displayBlock.src_y2; }
        } else {
            if (s1 > 0) { dx = displayBlock.x - displayBlock.src_x; dy = displayBlock.y - displayBlock.src_y; }
            else { dx = displayBlock.x - displayBlock.src_x2; dy = displayBlock.y - displayBlock.src_y2; }
        }
        return `(${dx}, ${dy})`;
    };

    return (
        <div className={`macroblock-info-box ${selectedBlock ? "visible" : ""}`}>
            <h4>Macroblock history</h4>

            <div className="macroblock-history grid-layout">

                <div className="mb-slot">
                    {hasPrev ? <Macroblock name="Moved" url={thumbs.movedPrev} width={blockWidth} height={blockHeight} />
                        : <div className="mb-placeholder"/>}
                </div>

                <div className="arrow-slot">
                    {hasPrev ? <>
                        <span className="vector-label">{getVectorText(true)}</span>
                        <div className="arrow">→</div>
                    </> : <div className="mb-placeholder"/>}
                </div>

                <div className="mb-slot">
                    {hasPrev ? <Macroblock name={isBiDir ? "Diff" : "Difference"} url={isBiDir ? thumbs.diffPrev : thumbs.diffUni} width={blockWidth} height={blockHeight} />
                        : <div className="mb-placeholder"/>}
                </div>

                <div className="arrow-slot">
                    {hasPrev ? <div className="arrow">→</div> : <div className="mb-placeholder"/>}
                </div>

                <div className="mb-slot center-slot">
                    {isBiDir ? (
                        <div className="center-stack">
                            <Macroblock name="Interpolation" url={thumbs.interpolation} width={blockWidth} height={blockHeight} />
                            <div className="arrow-down">↓</div>
                            <Macroblock name="Result" url={thumbs.result} width={blockWidth} height={blockHeight} />
                        </div>
                    ) : (
                        <Macroblock name="Result" url={thumbs.result} width={blockWidth} height={blockHeight} />
                    )}
                </div>

                <div className="arrow-slot">
                    {hasNext ? <div className="arrow">←</div> : <div className="mb-placeholder"/>}
                </div>

                <div className="mb-slot">
                    {hasNext ? <Macroblock name={isBiDir ? "Diff" : "Difference"} url={isBiDir ? thumbs.diffNext : thumbs.diffUni} width={blockWidth} height={blockHeight} />
                        : <div className="mb-placeholder"/>}
                </div>

                <div className="arrow-slot">
                    {hasNext ? <>
                        <span className="vector-label">{getVectorText(false)}</span>
                        <div className="arrow">←</div>
                    </> : <div className="mb-placeholder"/>}
                </div>

                <div className="mb-slot">
                    {hasNext ? <Macroblock name="Moved" url={thumbs.movedNext} width={blockWidth} height={blockHeight} />
                        : <div className="mb-placeholder"/>}
                </div>

            </div>

            <button className="macroblock-close-btn" onClick={() => setSelectedBlock(null)}>
                Close
            </button>
        </div>
    );
};

export default MacroblockHistory;