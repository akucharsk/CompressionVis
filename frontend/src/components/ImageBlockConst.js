import React from "react";

const ImageBlockConst = ({url, type}) => {
    return (
        <>
            <div className="image-block">
                <div >
                    <img 
                        src={url} 
                        alt="Image"
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