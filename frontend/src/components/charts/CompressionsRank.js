import "../../styles/components/charts/CompressionsRank.css";

import { useState } from "react";

const CompressionsRank = () => {

const compressedVideos = [
        "kompresja 1",
        "kompresja 1",
        "kompresja 1",
        "kompresja 1",
        "kompresja 1",
        "kompresja 1",
        "kompresja 1",
        "kompresja 1",
        "kompresja 1",
        "kompresja 1",
        "kompresja 1",
        "kompresja 1",
        "kompresja 1",
        "kompresja 1",
        "kompresja 1",
        "kompresja 1",
        "kompresja 1",
        "kompresja 1",
        "kompresja 1",
        "kompresja 1",
        "kompresja 1",
        "kompresja 1",
        "kompresja 1",
        "kompresja 1",
        "kompresja 1",
        "kompresja 1",
        "kompresja 1",
        "kompresja 1",
        "kompresja 1",
        "kompresja 1",
        "kompresja 1",
    ];


    const [orderOfSorting, setOrderOfSorting] = useState("Ascending");

    const handleAscendingButton = () => {
        if (orderOfSorting === "Descending") {
            setOrderOfSorting("Ascending");
        }
    }

    const handleDescendingButton = () => {
        if (orderOfSorting === "Ascending") {
            setOrderOfSorting("Descending");
        }
    }    


    return (
        <div className="charts-compressions-rank">
            <div className="rank-panel">
                <select></select>
                <div className="rank-sorting-container">
                    <button 
                        onClick={handleAscendingButton}
                        className={`order-button ${orderOfSorting === "Ascending" ? "active" : ""}`}    
                    >
                        Ascending
                    </button>
                    <button 
                        onClick={handleDescendingButton} 
                        className={`order-button ${orderOfSorting === "Descending" ? "active" : ""}`}
                    >
                        Descending
                    </button>
                </div>
            </div>
            <div className="sorted-rank">
                {compressedVideos.map((name, idx) => (
                    <div className="compression-in-select-panel" key={idx}>
                        {name}
                    </div>
                ))}
            </div>
        </div>
    )
}

export default CompressionsRank;