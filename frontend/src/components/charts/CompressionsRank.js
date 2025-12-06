// import "../../styles/components/charts/CompressionsRank.ccs";

const CompressionsRank = () => {
    return (
        <div className="rank-panel">
            <select></select>
            <div className="rank-sorting">
                <h3>Sort</h3>
                <div className="rank-sorting-buttons">
                    <button>
                        Ascending
                    </button>
                    <button>
                        Descending
                    </button>
                </div>
            </div>
        </div>
    )
}

export default CompressionsRank;