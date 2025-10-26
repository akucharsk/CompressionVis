import React from "react";
import "../../styles/components/comparison/Images.css";

const ImageFullScreen = ({ imageSrc, detailType, onPrev, onNext, onSwitchFullscreen, onClose }) => {
    return (
        <div className="image-fullscreen" role="dialog" aria-modal="true" onClick={() => onClose && onClose()}>
            {onSwitchFullscreen ? (
                <>
                    <button className="fs-nav fs-nav-left" onClick={(e) => { e.stopPropagation(); onSwitchFullscreen('left'); }} aria-label="Previous image">‹</button>
                    <img
                        src={imageSrc}
                        alt={detailType}
                        className="image-fullscreen-img"
                        onClick={(e) => e.stopPropagation()}
                    />
                    <button className="fs-nav fs-nav-right" onClick={(e) => { e.stopPropagation(); onSwitchFullscreen('right'); }} aria-label="Next image">›</button>
                </>
            ) : (
                <>
                    {onPrev && (
                        <button className="fs-nav fs-nav-left" onClick={(e) => { e.stopPropagation(); onPrev(); }} aria-label="Previous frame">‹</button>
                    )}
                    <img
                        src={imageSrc}
                        alt={detailType}
                        className="image-fullscreen-img"
                        onClick={(e) => e.stopPropagation()}
                    />
                    {onNext && (
                        <button className="fs-nav fs-nav-right" onClick={(e) => { e.stopPropagation(); onNext(); }} aria-label="Next frame">›</button>
                    )}
                </>
            )}

            <button className="fs-close" onClick={(e) => { e.stopPropagation(); onClose && onClose(); }} aria-label="Close full screen">✕</button>
        </div>
    );
};

export default ImageFullScreen;