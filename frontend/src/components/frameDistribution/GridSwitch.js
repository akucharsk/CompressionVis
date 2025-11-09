import '../../styles/components/distribution/GridSwitch.css';

function GridSwitch({ mode, setMode, disabled }) {
    const handleSwitch = () => {
        if (disabled) return;
        setMode(prev => (prev === "grid" ? "disappear" : "grid"));
    };

    return (
        <div className={`custom-switch ${disabled ? "disabled" : ""}`} onClick={handleSwitch}>
            <span className={mode === "grid" ? "active" : ""}>Grid</span>
            <span className={mode === "disappear" ? "active" : ""}>Disappear</span>
            <div className={`slider ${mode}`}></div>
        </div>
    );
}

export default GridSwitch;