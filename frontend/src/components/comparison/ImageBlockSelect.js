import React from "react";

const ImageBlockSelect = ({ types, selectedType, setSelectedType, ref }) => {
    const handleChange = (e) => {
        setSelectedType(e.target.value);
    };
    
    return (
        <>
            <div className="comparision-block">
                <div className="image-block">
                    <img 
                        alt="Image"
                        ref={ref}
                    >
                    </img>
                </div>
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