import React, { useEffect, useState } from "react";
import "../../styles/components/comparison/Images.css";
import ImageDetails from "./ImageDetails";
import ImageFullScreen from "./ImageFullScreen";
import { useComparisonImage } from "./useComparisonImage";

const ImageBlock = ({
                        isConst = true,
                        selectedIdx = 0,
                        metrics = {},
                        navigation = {},
                        fullscreen = {},
                    }) => {
    const [collapsed] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const { imgSrc, compressedIds, fetchImagesForComparison } = useComparisonImage(isConst, selectedIdx);

    useEffect(() => {
        if (typeof fullscreen.is === "boolean") {
            setIsFullscreen(fullscreen.is);
        }
    }, [fullscreen.is]);

    const handleSelectChange = (e) => {
        const val = parseInt(e.target.value);
        fetchImagesForComparison(val === -1, val);
    };

    const openFullscreen = () => {
        if (fullscreen.onOpen) fullscreen.onOpen();
        else setIsFullscreen(true);
    };

    const closeFullscreen = () => {
        if (fullscreen.onClose) fullscreen.onClose();
        else setIsFullscreen(false);
    };

    return (
        <div className={`image-block ${collapsed ? "collapsed" : ""}`}>
            <div className="image-block-content">
                {isConst ? (
                    <div className="static-name">Active param</div>
                ) : (
                    <select onChange={handleSelectChange}>
                        <option key={-1} value={-1}>Original Video</option>
                        {compressedIds.map((id, idx) => (
                            <option key={idx} value={id}>ID: {id}</option>
                        ))}
                    </select>
                )}

                <img
                    alt="Image"
                    className="image-block-img"
                    src={imgSrc}
                    onClick={openFullscreen}
                />

                <ImageDetails
                    type={metrics.type}
                    details={metrics.details}
                    compressionParams={metrics.compressionParams}
                />
            </div>

            {isFullscreen && (
                <ImageFullScreen
                    imageSrc={imgSrc}
                    detailType={metrics.type}
                    onPrev={navigation.onPrev}
                    onNext={navigation.onNext}
                    onSwitchFullscreen={fullscreen.onSwitch}
                    onClose={closeFullscreen}
                />
            )}
        </div>
    );
};

export default ImageBlock;
