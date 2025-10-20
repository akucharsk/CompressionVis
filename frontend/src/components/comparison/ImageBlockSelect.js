import React from "react";
import "../../styles/components/comparison/Images.css";

const ImageBlockSelect = ({ types, selectedType, setSelectedType, imageRef }) => {
    const handleChange = (e) => {
        setSelectedType(e.target.value);
    };
    return (
        <>
            <div className="image-block">
                <img
                    alt="Image"
                    ref={imageRef}
                >
                </img>
                <div className="compression-type">
                    <select value={selectedType} onChange={handleChange}>
                        {types.map((type, idx) => (
                            <option key={idx} value={type}>{type}</option>
                        ))}
                    </select>
                </div>
            </div>
        </>
    ); 
};

export default ImageBlockSelect;