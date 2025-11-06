import React, {useEffect, useRef, useState} from "react";
import {MAX_RETRIES} from "../../utils/constants";
import {useSearchParams} from "react-router-dom";
import {apiUrl} from "../../utils/urls";
import {fetchImage} from "../../api/fetchImage";
import './../../styles/components/distribution/Frame.css';
import {useError} from "../../context/ErrorContext";
import {useMacroblocks} from "../../context/MacroblocksContext";
import MacroblockInfo from "./MacroblockInfo";

const Frame = ({ frames, selectedIdx, showGrid, showVectors, visibleCategories }) => {
    const [imageUrl, setImageUrl] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [blocks, setBlocks] = useState([]);
    const [currentFrameIdx, setCurrentFrameIdx] = useState(null);
    const [params] = useSearchParams();
    const videoId = parseInt(params.get("videoId"));
    const [selectedBlock, setSelectedBlock] = useState(null);
    const { showError } = useError();
    const canvasRef = useRef(null);
    const imgRef = useRef(null);
    const { frameMacroBlocksQuery } = useMacroblocks();

    useEffect(() => {
        if (selectedIdx === null) {
            setImageUrl(null);
            setCurrentFrameIdx(null);
            return;
        }

        if (selectedIdx === currentFrameIdx) {
            return;
        }

        const controller = new AbortController();
        let isMounted = true;

        const loadImage = async () => {
            if (imageUrl === null) {
                setIsLoading(true);
            }

            try {
                const url = await fetchImage(
                    MAX_RETRIES,
                    `${apiUrl}/frames/${videoId}/${selectedIdx}/`,
                    controller
                );
                if (isMounted) {
                    setImageUrl(url);
                    setCurrentFrameIdx(selectedIdx);
                }
            } catch (error) {
                if (error.name === "AbortError") return;
                if (isMounted) showError(error.message, error.statusCode);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        loadImage();

        return () => {
            controller.abort();
            isMounted = false;
        };
    }, [selectedIdx, videoId, frames, showError, currentFrameIdx, imageUrl]);

    const mapSelectedBlockToNewFrame = (oldBlock, newBlocks) => {
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

        const overlapCandidates = newBlocks.filter(block => {
            const x0 = block.x - block.width / 2;
            const y0 = block.y - block.height / 2;
            const x1 = oldBlock.x - oldBlock.width / 2;
            const y1 = oldBlock.y - oldBlock.height / 2;

            const overlapX = Math.max(0, Math.min(x0 + block.width, x1 + oldBlock.width) - Math.max(x0, x1));
            const overlapY = Math.max(0, Math.min(y0 + block.height, y1 + oldBlock.height) - Math.max(y0, y1));
            return overlapX > 0 && overlapY > 0;
        });

        if (overlapCandidates.length > 0) {
            return overlapCandidates[0];
        }

        return null;
    };

    useEffect(() => {
        if (!selectedBlock || blocks.length === 0) return;

        const newSelected = mapSelectedBlockToNewFrame(selectedBlock, blocks);
        setSelectedBlock(newSelected);
    }, [selectedIdx, blocks, selectedBlock]);

    useEffect(() => {
        if (frameMacroBlocksQuery.isSuccess) {
            if (frameMacroBlocksQuery.data?.blocks) {
                setBlocks(frameMacroBlocksQuery.data.blocks);
            } else {
                setBlocks([]);
                setSelectedBlock(null);
            }
        }
    }, [frameMacroBlocksQuery.isSuccess, frameMacroBlocksQuery.data]);

    useEffect(() => {
        if (frameMacroBlocksQuery.data?.blocks) {
            setBlocks(frameMacroBlocksQuery.data.blocks);
        }
    }, [frameMacroBlocksQuery.data])

    const getCategoryColor = (blockType) => {
        switch(blockType) {
            case 'intra': return 'rgba(255, 0, 0, 0.7)';
            case 'inter': return 'rgba(0, 255, 0, 0.7)';
            case 'skip': return 'rgba(0, 0, 255, 0.7)';
            case 'direct': return 'rgba(0, 255, 255, 0.7)'
            default: return 'rgba(128, 128, 128, 0.7)';
        }
    };

    const handleCanvasClick = (e) => {
        if (!frameMacroBlocksQuery.data?.blocks || blocks.length === 0) {
            return;
        }

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
        const canvas = canvasRef.current;
        const img = imgRef.current;
        if (!canvas || !img) return;

        const ctx = canvas.getContext("2d");

        if (img.naturalWidth === 0 || img.naturalHeight === 0) return;

        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.drawImage(img, 0, 0);

        if (showGrid && blocks.length > 0) {
            blocks.forEach(block => {
                const category = block.type || 'intra';

                if (!visibleCategories[category]) {
                    ctx.globalAlpha = 0.2;
                } else {
                    ctx.globalAlpha = 1.0;
                }

                ctx.strokeStyle = getCategoryColor(category);
                ctx.lineWidth = 1;

                const x = block.x - block.width / 2;
                const y = block.y - block.height / 2;
                ctx.strokeRect(x, y, block.width, block.height);
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

        if (showVectors && blocks.length > 0) {
            blocks.forEach(block => {
                if (block.src_x === undefined || block.src_y === undefined) return;

                const category = block.type || 'intra';

                if (!visibleCategories[category]) {
                    ctx.globalAlpha = 0.2;
                } else {
                    ctx.globalAlpha = 1.0;
                }

                ctx.strokeStyle = getCategoryColor(category);
                ctx.lineWidth = 2;

                ctx.beginPath();
                ctx.moveTo(block.src_x, block.src_y);
                ctx.lineTo(block.x, block.y);
                ctx.stroke();
            });
            ctx.globalAlpha = 1.0;
        }
    }, [showGrid, showVectors, blocks, imageUrl, selectedBlock, visibleCategories]);


    return (
        <div className="left-section">
            {frames.length > 0 && selectedIdx < frames.length && (
                <div className="frame-preview" style={{ position: "relative" }}>
                    {isLoading && imageUrl === null ? (
                        <div className="spinner"></div>
                    ) : (
                        <>
                            <img
                                key={selectedIdx}
                                ref={imgRef}
                                src={imageUrl}
                                alt={`Frame ${selectedIdx}`}
                                style={{ display: "block", width: "100%", height: "auto" }}
                            />
                            <canvas
                                ref={canvasRef}
                                onClick={handleCanvasClick}
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    pointerEvents: blocks.length > 0 ? "auto" : "none",
                                    width: "100%",
                                    height: "100%",
                                    cursor: blocks.length > 0 ? "pointer" : "default"
                                }}
                            />
                        </>
                    )}
                </div>
            )}

            <MacroblockInfo
                selectedBlock={selectedBlock}
                setSelectedBlock={setSelectedBlock}
                frameImageUrl={imageUrl}
            />
        </div>
    );
};

export default Frame;