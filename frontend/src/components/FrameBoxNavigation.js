import { useEffect, useRef } from "react";
import { useDisplayMode } from "../context/DisplayModeContext";
import { useFps } from "../context/FpsContext";
import { useFrames } from "../context/FramesContext";
import { useVideoPlaying } from "../context/VideoPlayingContext";

const FrameBoxNavigation = () => {
    const { frames, selectedIdx, setSelectedIdx } = useFrames();
    const { isVideoPlaying, setIsVideoPlaying } = useVideoPlaying();
    const { setDisplayMode } = useDisplayMode();
    const { fps, setFps } = useFps();

    const inputSelectedIdxRef = useRef(null);


    const handleScrollLeft = () => {
        setDisplayMode("frames");
        setSelectedIdx(prev => Math.max(0, prev - 1));
    };

    const handleScrollRight = () => {
        setDisplayMode("frames");
        setSelectedIdx(prev => Math.min(frames.length - 1, prev + 1));
    };

    const handleMinusTen = () => {
        setDisplayMode("frames");
        setSelectedIdx(prev => Math.max(0, prev - 10));
    };

    const handlePlusTen = () => {
        setDisplayMode("frames");
        setSelectedIdx(prev => Math.min(frames.length - 1, prev + 10));
    };

    const handlePlay = () => {
        setIsVideoPlaying(true);
        setDisplayMode("video");
    };

    const handlePause = () => {
        setIsVideoPlaying(false);
        // setDisplayMode("frames");
    };

    const handleRestart = () => {
        setSelectedIdx(0);
    };

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

    const handleInput = (event) => {
        if (event.key === "Enter") {
            const inputSelectedIdx = inputSelectedIdxRef.current;

            if (!inputSelectedIdx) return;

            let inputValue = inputSelectedIdx.value - 1
            
            if (inputValue >= frames.length) {
                setSelectedIdx(frames.length - 1);
                inputSelectedIdx.value = frames.length;
                return;
            }
            if (inputValue < 1 ) {
                setSelectedIdx(0);
                inputSelectedIdx.value = 1;
                return;
            }
            setSelectedIdx(inputValue);
            inputSelectedIdx.value = inputValue + 1;
        }
    }


    useEffect(() => {
        const inputSelectedIdx = inputSelectedIdxRef.current;
        
        if (!inputSelectedIdx) return;

        inputSelectedIdx.value = selectedIdx + 1;
    }, [selectedIdx])

    useEffect(() => {
        const min = 6;
        const max = 30;
        const percent = ((fps - min) / (max - min)) * 100;
        document.documentElement.style.setProperty("--percent", `${percent}%`);
    }, [fps]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            const inputSelectedIdx = inputSelectedIdxRef.current;

            if (inputSelectedIdx === document.activeElement) return;

            if (e.key === 'ArrowLeft') {
                
                setSelectedIdx(prev => Math.max(0, prev - 1));
            } else if (e.key === 'ArrowRight') {
                setSelectedIdx(prev => Math.min(frames.length - 1, prev + 1));
            } 
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [frames.length, setSelectedIdx]);

    return (
        <div className="timeline-header">
            <div className="timeline-controls">
                <button className="scroll-button left" onClick={handleMinusTen}>
                    <div>&lt;&lt;</div>
                </button>
                <button className="scroll-button left" onClick={handleScrollLeft}>
                    &lt;
                </button>
                {isVideoPlaying ? 
                    <button 
                        className="play-button playing"
                        onClick={handlePause}    
                    > 
                    ⏹
                    </button>
                : !isVideoPlaying && selectedIdx == frames.length - 1 ?  
                    <button 
                        className="play-button "
                        onClick={handleRestart}
                    >
                    ⟳
                    </button> :    
                    <button 
                        className="play-button "
                        onClick={handlePlay}
                    >
                    ▶
                    </button>}
                <button className="scroll-button right" onClick={handleScrollRight}>
                    &gt;
                </button>
                <button className="scroll-button right " onClick={handlePlusTen}>
                    <div>&gt;&gt;</div>
                </button>
            </div>
            <div className="timeline-rightbar">
                <div className="frame-counter">
                    <input 
                        type="number"
                        ref={inputSelectedIdxRef} 
                        className="input-selectedidx" 
                        onKeyDown={handleInput}
                    >
                    </input>
                    <p>/ {frames.length}</p>
                </div>
                <div className="speed-control">
                    <div className="speed-description">
                        <label>Speed: </label>
                        <div className="speed-value"> {fps} FPS</div>
                    </div>
                    <div className="speed-slider-container">
                        <input
                            type="range"
                            min="6"
                            max="30"
                            step="6"
                            value={fps}
                            onChange={(e) => setFps(Number(e.target.value))}
                            className="speed-slider"
                        />
                    </div>
                </div>
                <button className="scroll-button-mini right" onClick={handleNextIFrame}>
                    <p>Next I-Frame</p>
                </button>
            </div>
            
        </div>
    )
}

export default FrameBoxNavigation;


// import { useEffect } from "react";
// import { useDisplayMode } from "../context/DisplayModeContext";
// import { useFps } from "../context/FpsContext";
// import { useFrames } from "../context/FramesContext";
// import { useVideoPlaying } from "../context/VideoPlayingContext";

// const FrameBoxNavigation = () => {
//     const { frames, selectedIdx, setSelectedIdx } = useFrames();
//     const { isVideoPlaying, setIsVideoPlaying } = useVideoPlaying();
//     const { setDisplayMode } = useDisplayMode();
//     const { fps, setFps } = useFps();

//     // handlers for buttons
//     const handleScrollLeft = () => {
//         setDisplayMode("frames");
//         setSelectedIdx(prev => Math.max(0, prev - 1));
//     };

//     const handleScrollRight = () => {
//         setDisplayMode("frames");

//         setSelectedIdx(prev => Math.min(frames.length - 1, prev + 1));
//     };

//     const handleMinusTen = () => {
//         setDisplayMode("frames");
//         setSelectedIdx(prev => Math.max(0, prev - 10));
//     };

//     const handlePlusTen = () => {
//         setDisplayMode("frames");
//         setSelectedIdx(prev => Math.min(frames.length - 1, prev + 10));
//     };

//     const handlePlay = () => {
//         setIsVideoPlaying(true);
//         setDisplayMode("video");
//     };

//     const handlePause = () => {
//         setIsVideoPlaying(false);
//     };

//     const handleRestart = () => {
//         setSelectedIdx(0);
//     };

//     // changing color of speed slider
//     useEffect(() => {
//         const min = 6;
//         const max = 30;
//         const percent = ((fps - min) / (max - min)) * 100;
//         document.documentElement.style.setProperty("--percent", `${percent}%`);
//     }, [fps]);

//     // handling key signals
//     useEffect(() => {
//         const handleKeyDown = (e) => {
//             if (e.key === 'ArrowLeft') {
//                 handleScrollLeft();
//             } else if (e.key === 'ArrowRight') {
//                 handleScrollRight();
//             }
//         };

//         window.addEventListener('keydown', handleKeyDown);
//         return () => window.removeEventListener('keydown', handleKeyDown);
//     }, [frames.length, setSelectedIdx]);


//     return (
//         <div className="timeline-header">
//             <div></div>
//             <div className="timeline-controls">
//                 <button className="scroll-button-mini left" onClick={handleMinusTen}>
//                     <div>&lt;&lt;</div>
//                     <h6>-10</h6>
//                 </button>
//                 <button className="scroll-button left" onClick={handleScrollLeft}>
//                     &lt;
//                 </button>
//                 {isVideoPlaying ? 
//                     <button 
//                         className="play-button playing"
//                         onClick={handlePause}    
//                     > 
//                     ⏹
//                     </button>
//                 : !isVideoPlaying && selectedIdx == frames.length - 1 ?  
//                     <button 
//                         className="play-button "
//                         onClick={handleRestart}
//                     >
//                     ⟳
//                     </button> :    
//                     <button 
//                         className="play-button "
//                         onClick={handlePlay}
//                     >
//                     ▶
//                     </button>}
//                 <button className="scroll-button right" onClick={handleScrollRight}>
//                     &gt;
//                 </button>
//                 <button className="scroll-button-mini right " onClick={handlePlusTen}>
//                     <div>&gt;&gt;</div>
//                     <h6>+10</h6>
//                 </button>
//             </div>
//             <div className="timeline-rightbar">
//                 <div className="frame-counter">
//                     {selectedIdx + 1} / {frames.length}
//                 </div>
//                 <div className="speed-control">
//                     <div className="speed-description">
//                         <label>Speed: </label>
//                         <div className="speed-value"> {fps} FPS</div>
//                     </div>
//                     <div className="speed-slider-container">
//                         <input
//                             type="range"
//                             min="6"
//                             max="30"
//                             step="6"
//                             value={fps}
//                             onChange={(e) => setFps(Number(e.target.value))}
//                             className="speed-slider"
//                         />
//                     </div>
//                 </div>
//             </div>
//         </div>
//     )
// }

// export default FrameBoxNavigation;