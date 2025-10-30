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

        if (showGrid && blocks.length > 0) {
            blocks.forEach(block => {
                const category = block.type || 'intra';

                if (!visibleCategories[category]) {
                    ctx.globalAlpha = 0.2;
                } else {
                    ctx.globalAlpha = 1.0;
                }

                ctx.strokeStyle = getCategoryColor(category);
                ctx.lineWidth = selectedBlock === block ? 3 : 1;

                const x = block.x - block.width / 2;
                const y = block.y - block.height / 2;
                ctx.strokeRect(x, y, block.width, block.height);
            });
            ctx.globalAlpha = 1.0;
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
                                    pointerEvents: "auto",
                                    width: "100%",
                                    height: "100%",
                                    cursor: "pointer"
                                }}
                            />
                        </>
                    )}
                </div>
            )}

            <MacroblockInfo selectedBlock={selectedBlock} />
        </div>
    );
};

export default Frame;