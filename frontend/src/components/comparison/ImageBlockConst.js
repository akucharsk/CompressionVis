import React from "react";
import "../../styles/components/comparison/Images.css";

const ImageBlockConst = ({ type, ref }) => {
    return (
        <>
            <div className="image-block">
                <div >
                    <img 
                        alt="Image"
                        ref={ref}
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