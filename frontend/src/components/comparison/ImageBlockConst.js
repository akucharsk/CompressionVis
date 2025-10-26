import React from "react";
import "../../styles/components/comparison/Images.css";

const ImageBlockConst = ({ type, imageRef }) => {
    return (
        <>
            <div className="image-block">
                <div >
                    <img 
                        alt="Image"
                        ref={imageRef}
                    >
                    </img>
                </div>
                <div className="compression-type">
                    {type}
                </div>
            </div>
        </>
    ); 
};

export default ImageBlockConst;