// import "../../styles/components/charts/CompressionsRank.ccs";

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
        <div className="rank-panel">
            <select></select>
            <div className="rank-sorting">
                <h3>Rank of average values for certain compressed videos</h3>
                <div className="rank-sorting-buttons">
                    <button 
                        onClick={handleAscendingButton}
                        className={`order-button ${orderOfSorting === "Ascending" ? "selected" : ""}`}    
                    >
                        Ascending
                    </button>
                    <button 
                        onClick={handleDescendingButton} 
                        className={`order-button ${orderOfSorting === "Descending" ? "selected" : ""}`}
                    >
                        Descending
                    </button>
                </div>
            </div>
        </div>
    )
}

export default CompressionsRank;