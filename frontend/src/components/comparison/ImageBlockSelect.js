import React from "react";
import "../../styles/components/comparison/Images.css";

const ImageBlockSelect = ({ types, selectedType, setSelectedType, ref }) => {
    // const handleChange = (e) => {
    //     setSelectedType(e.target.value);
    // };
    
    return (
        <>
            <div className="image-block">
                <img
                    alt="Image"
                    ref={ref}
                >
                </img>
                <div className="compression-type">
                    {/* <select value={selectedType} onChange={handleChange}>
                        {types.map((type, idx) => (
                            <option key={idx} value={type}>{type}</option>
                        ))}
                    </select> */}
                    Compressed
                </div>
            </div>
        </>
    ); 
};

export default ImageBlockSelect;