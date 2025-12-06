import "../../styles/components/charts/CompressionsRank.css";

import { useState } from "react";

const CompressionsRank = () => {

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
        <>
            <div className="rank-panel">
                <select></select>
                <div className="rank-sorting-container">
                    <div className="rank-sorting-buttons">
                        
                    </div>
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
                
            </div>
        </>
    )
}

export default CompressionsRank;