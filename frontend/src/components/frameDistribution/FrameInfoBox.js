import { useFrames } from "../../context/FramesContext";

export default function FrameInfoBox() {
  const { selectedIdx, frames } = useFrames();
  return (
    <div className="content-box info">
      <h3>Frame Information</h3>
      <p>Frame: {selectedIdx + 1}</p>
      <p>Type: {frames[selectedIdx]?.type}</p>
      <p>PTS time: {parseFloat(frames[selectedIdx]?.pts_time).toFixed(2)}s</p>
      <p>DTS time: {parseFloat(frames[selectedIdx]?.dts_time).toFixed(2)}s</p>
      <p>Scene score: {frames[selectedIdx]?.scene_score}</p>
      <p>
          Frame size:{" "}
          {Intl.NumberFormat("pl-PL").format(frames[selectedIdx]?.pkt_size)}B
      </p>
    </div>
  )
}