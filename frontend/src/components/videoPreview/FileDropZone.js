import React, { useState } from "react";

const FileDropZone = ({
                          onFileSelected,
                          accept = "video/*",
                          label = "Select from disk",
                          placeholder = "Or drag it here",
                      }) => {
    const [dragActive, setDragActive] = useState(false);
    const [fileName, setFileName] = useState(null);

    const handleDrop = (e) => {
        e.preventDefault();
        setDragActive(false);
        if (e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            setFileName(file.name);
            onFileSelected(file);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragActive(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setDragActive(false);
    };

    const handleFileChange = (e) => {
        if (e.target.files.length > 0) {
            const file = e.target.files[0];
            setFileName(file.name);
            onFileSelected(file);
        }
    };

    return (
        <div
            className={`video-thumbnail ${dragActive ? "active" : ""} drop-zone`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <input
                type="file"
                accept={accept}
                id="fileInput"
                style={{display: "none"}}
                onChange={handleFileChange}
            />
            <button onClick={() => document.getElementById("fileInput").click()}>
                {label}
            </button>
            <span>{fileName ? `Wybrany plik: ${fileName}` : placeholder}</span>
        </div>
    );
};

export default FileDropZone;
