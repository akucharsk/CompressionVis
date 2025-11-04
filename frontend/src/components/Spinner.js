export default function Spinner({ size = null }) {
  size = size || 50;
  const borderSize = size / 10;
  const style = {
      width: `${size}px`,
      height: `${size}px`,
      border: `${borderSize}px solid rgba(255, 255, 255, 0.3)`,
      borderTop: `${borderSize}px solid var(--netflix-red)`
  }
  return (
      <div className="spinner" style={style}></div>
  )
}
