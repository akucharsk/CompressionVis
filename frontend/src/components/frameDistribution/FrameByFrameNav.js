const FrameByFrameNav = ({ frames, selectedIdx, setSelectedIdx }) => {

    const handleScrollLeft = () => {
        setSelectedIdx(prev => Math.max(0, prev - 1));
    };

    const handleScrollRight = () => {
        setSelectedIdx(prev => Math.min(frames.length - 1, prev + 1));
    };

    const handleMinusTen = () => {
        setSelectedIdx(prev => Math.max(0, prev - 10));
    }

    const handlePlusTen = () => {
        setSelectedIdx(prev => Math.min(frames.length - 1, prev + 10));
    }

    const handleNextIFrame = () => {
        if (frames.length === 0) return;
        const iFrames = frames
            .map((frame, idx) => ({ frame, idx }))
            .filter(({ frame }) => frame.type === "I")
            .map(({ idx }) => idx);

        if (iFrames.length === 0) return;
        const currentPos = iFrames.indexOf(selectedIdx);
        const nextPos = (currentPos + 1) % iFrames.length;
        setSelectedIdx(iFrames[nextPos]);
    }

    return (
        <> 
            <button className="scroll-button left" onClick={handleMinusTen}>
                -10
            </button>
            <button className="scroll-button left" onClick={handleScrollLeft}>
                &lt;
            </button>
            <button className="scroll-button right" onClick={handleScrollRight}>
                &gt;
            </button>
            <button className="scroll-button right" onClick={handlePlusTen}>
                +10
            </button>
            <button className="scroll-button right" onClick={handleNextIFrame}>
                Next I-Frame
            </button>
        </>
    )
}

export default FrameByFrameNav;