import React, {useCallback, useEffect, useRef} from "react";
import './../../styles/components/distribution/Frame.css';
import {useMacroblocks} from "../../context/MacroblocksContext";
import Spinner from "../Spinner";
import { useFrames } from "../../context/FramesContext";
import { apiUrl } from "../../utils/urls";
import { useSearchParams } from "react-router-dom";
import {useSettings} from "../../context/SettingsContext";

const Frame = ({
                   showGrid,
                   visibleCategories,
                   selectedBlock,
                   setSelectedBlock,
                   mode,
                   macroblocks,
                   fullscreenHandler,
                   videoId,
                   showPast,
                   showFuture,
                   showBidirectional
               }) => {
    const [ params ] = useSearchParams();
    if(!videoId) {
        videoId = parseInt(params.get("videoId"));
    }
    const {frames, selectedIdx} = useFrames();
    const canvasRef = useRef(null);
    const imgRef = useRef(null);
    const {frameMacroBlocksQuery} = useMacroblocks();
    const { resolutionWidth, resolutionHeight } = useSettings();
    const imageUrl = `${apiUrl}/frames/${videoId}/${selectedIdx}?width=${resolutionWidth}&height=${resolutionHeight}`;

    const drawCanvas = useCallback(() => {
        if (!frameMacroBlocksQuery.data?.blocks) return;
        const blocks = frameMacroBlocksQuery.data.blocks;
        const canvas = canvasRef.current;
        const img = imgRef.current;
        if (!canvas || !img) return;
        const ctx = canvas.getContext("2d");

        if (img.naturalWidth === 0 || img.naturalHeight === 0) return;

        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (mode === "disappear" && blocks.length > 0) {
            blocks.forEach(block => {
                const category = block.type || 'intra';
                if (visibleCategories[category]) {
                    const x = block.x - block.width / 2;
                    const y = block.y - block.height / 2;
                    ctx.drawImage(img, x, y, block.width, block.height, x, y, block.width, block.height);
                }
            });
        } else {
            ctx.drawImage(img, 0, 0);
        }

        if (mode === "grid" && showGrid && blocks.length > 0) {
            blocks.forEach(block => {
                const category = block.type || 'intra';
                ctx.globalAlpha = visibleCategories[category] ? 1.0 : 0.2;
                ctx.strokeStyle = getCategoryColor(category);
                ctx.lineWidth = 1;
                const x = block.x - block.width / 2 + 1;
                const y = block.y - block.height / 2 + 1;
                ctx.strokeRect(x, y, block.width - 2, block.height - 2);
            });
            ctx.globalAlpha = 1.0;
        }

        if (selectedBlock) {
            const x = selectedBlock.x - selectedBlock.width / 2;
            const y = selectedBlock.y - selectedBlock.height / 2;
            ctx.shadowColor = 'rgba(0, 0, 0, 1.0)';
            ctx.shadowBlur = 5;
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 3;
            ctx.strokeRect(x, y, selectedBlock.width, selectedBlock.height);
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, selectedBlock.width, selectedBlock.height);
        }

        const isAnyVectorActive = showPast || showFuture || showBidirectional;

        if (isAnyVectorActive && blocks.length > 0) {
            blocks.forEach(block => {
                if (block.src_x == null || block.src_y == null) return;

                const hasRef1 = block.source != null;
                const hasRef2 = block.source2 != null;
                const isBidirectionalBlock = hasRef1 && hasRef2;

                if (showBidirectional && !isBidirectionalBlock) {
                    return;
                }

                const drawVector = (srcX, srcY) => {
                    const category = block.type || 'intra';
                    const color = getCategoryColor(category);

                    const dx = block.x - srcX;
                    const dy = block.y - srcY;
                    const length = Math.sqrt(dx * dx + dy * dy);

                    ctx.shadowColor = 'rgba(0, 0, 0, 1.0)';
                    ctx.shadowBlur = 3;
                    ctx.strokeStyle = color;
                    ctx.globalAlpha = 1.0;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(srcX, srcY);
                    ctx.lineTo(block.x, block.y);
                    ctx.stroke();

                    if (length >= 1) {
                        const angle = Math.atan2(dy, dx);
                        const arrowSize = 8;
                        const arrowAngle = Math.PI / 6;

                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.moveTo(
                            block.x - arrowSize * Math.cos(angle - arrowAngle),
                            block.y - arrowSize * Math.sin(angle - arrowAngle)
                        );
                        ctx.lineTo(block.x, block.y);
                        ctx.lineTo(
                            block.x - arrowSize * Math.cos(angle + arrowAngle),
                            block.y - arrowSize * Math.sin(angle + arrowAngle)
                        );
                        ctx.stroke();
                    }

                    ctx.shadowColor = 'transparent';
                    ctx.shadowBlur = 0;
                };

                const tryDrawVector = (source, x, y) => {
                    if (source == null) return;

                    const isPrev = source < 0;
                    const isNext = source > 0;

                    if (showBidirectional) {
                        drawVector(x, y);
                    } else {
                        if ((isPrev && showPast) || (isNext && showFuture)) {
                            drawVector(x, y);
                        }
                    }
                };

                tryDrawVector(block.source, block.src_x, block.src_y);
                tryDrawVector(block.source2, block.src_x2, block.src_y2);
            });
            ctx.globalAlpha = 1.0;
        }
    }, [frameMacroBlocksQuery.data?.blocks, showGrid, selectedBlock, visibleCategories, mode, showPast, showFuture, showBidirectional]);

    const mapSelectedBlockToNewFrame = useCallback((oldBlock, newBlocks) => {
        if (!macroblocks) return null;
        if (!oldBlock || !newBlocks || newBlocks.length === 0) return null;

        const oldCenterX = oldBlock.x;
        const oldCenterY = oldBlock.y;

        const candidates = newBlocks.filter(block => {
            const x0 = block.x - block.width / 2;
            const y0 = block.y - block.height / 2;
            return oldCenterX >= x0 && oldCenterX <= x0 + block.width &&
                oldCenterY >= y0 && oldCenterY <= y0 + block.height;
        });

        if (candidates.length > 0) {
            return candidates[0];
        }
        return null;
    }, [macroblocks]);

    useEffect(() => {
        if (!macroblocks || !frameMacroBlocksQuery.data?.blocks || !selectedBlock) return;
        const newSelected = mapSelectedBlockToNewFrame(selectedBlock, frameMacroBlocksQuery.data.blocks);
        setSelectedBlock(newSelected);
    }, [selectedIdx, frameMacroBlocksQuery.data?.blocks, selectedBlock, setSelectedBlock, macroblocks, mapSelectedBlockToNewFrame]);

    const getCategoryColor = (blockType) => {
        switch (blockType) {
            case 'intra':
                return 'rgba(255, 0, 0, 0.8)';
            case 'inter':
                return 'rgba(0, 255, 0, 0.8)';
            case 'skip':
                return 'rgba(0, 0, 255, 0.8)';
            case 'direct':
                return 'rgba(0, 255, 255, 0.8)'
            default:
                return 'rgba(128, 128, 128, 0.8)';
        }
    };

    const handleCanvasClick = (e) => {
        if (!frameMacroBlocksQuery.data?.blocks) {
            return;
        }
        const blocks = frameMacroBlocksQuery.data.blocks || [];

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();

        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const clickX = (e.clientX - rect.left) * scaleX;
        const clickY = (e.clientY - rect.top) * scaleY;

        const clickedBlock = blocks.find(block => {
            const x = block.x - block.width / 2;
            const y = block.y - block.height / 2;
            return clickX >= x && clickX <= x + block.width &&
                clickY >= y && clickY <= y + block.height;
        });

        if (clickedBlock) {
            setSelectedBlock(clickedBlock);
        } else {
            setSelectedBlock(null);
        }
    };

    useEffect(() => {
        if (macroblocks) {
            drawCanvas()
        }
    }, [drawCanvas, macroblocks]);

    const blocks = frameMacroBlocksQuery.data?.blocks || [];

    return (
        <>
            {frames.length > 0 && selectedIdx < frames.length && (
                <div className="frame-preview" style={{position: "relative"}}>
                    {imageUrl === null ? (
                        <Spinner/>
                    ) : imageUrl && macroblocks ? (
                        <>
                            <img
                                ref={imgRef}
                                src={imageUrl}
                                alt={`Frame ${selectedIdx} (${frames[selectedIdx].type})`}
                                style={{
                                    display: mode === "disappear" ? "none" : "block",
                                    width: "100%",
                                    height: "auto"
                                }}
                                onLoad={drawCanvas}
                            />
                            <canvas
                                ref={canvasRef}
                                onClick={handleCanvasClick}
                                style={{
                                    position: mode === "disappear" ? "relative" : "absolute",
                                    top: 0,
                                    left: 0,
                                    pointerEvents: blocks.length > 0 ? "auto" : "none",
                                    width: "100%",
                                    height: "100%",
                                    cursor: blocks.length > 0 ? "pointer" : "default"
                                }}
                            />
                        </>
                    ) : imageUrl && !macroblocks ? (
                        <img
                            src={imageUrl}
                            alt={`Frame ${selectedIdx} (${frames[selectedIdx].type})`}
                            onClick={fullscreenHandler}
                        />
                    ) : null}
                </div>
            )}
        </>
    );
}
export default Frame;