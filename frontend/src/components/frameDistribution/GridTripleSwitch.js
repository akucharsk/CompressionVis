import '../../styles/components/distribution/GridSwitch.css';

function GridTripleSwitch({ mode, setMode, disabled }) {
    const handleSwitch = (newMode) => {
        if (disabled) return;
        setMode(newMode);
    };

    return (
        <div className={`grid-triple-switch ${disabled ? "disabled" : ""}`}>
            <span
                className={mode === "previous" ? "active" : ""}
                onClick={() => handleSwitch("previous")}
            >
                Previous
            </span>
            <span
                className={mode === "both" ? "active" : ""}
                onClick={() => handleSwitch("both")}
            >
                Both
            </span>
            <span
                className={mode === "next" ? "active" : ""}
                onClick={() => handleSwitch("next")}
            >
                Next
            </span>

            <div className={`slider ${mode}`}></div>
        </div>
    );
}

export default GridTripleSwitch;